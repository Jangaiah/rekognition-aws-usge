// import { avgColor,  contrastRatio } from "../utils/util";
import { brightnessRgb,  contrastRatio, clamp } from "../utils/util.js";
import AWS from 'aws-sdk';
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const rekognition = new AWS.Rekognition();

export async function fixContrast(imgBuf, options = {}) {
    try {
        return new Promise(async (resolve, reject) => {
        // options.threshold (contrast threshold)
        const threshold = options.threshold || 4.5;
        // call Rekognition detectText
        const rekParams = { Image: { Bytes: imgBuf } };

        const rekResult = await rekognition.detectText(rekParams).promise();
        // fetch image size
        const meta = await sharp(imgBuf).metadata();
        const imgW = meta.width;
        const imgH = meta.height;

        if (!rekResult || !Array.isArray(rekResult.TextDetections) || rekResult.TextDetections.length === 0) {
            resolve({ allPass: true, message: "No text detected", reports: [] });
        }

        const reports = [];
        const overlays = []; // svg rects to draw
        // we'll only draw overlays if we find failing items
        for (const td of rekResult.TextDetections) {
            // skip low confidence detections
            const conf = td.Confidence || 0;
            if (conf < 60) continue; // tune as needed

            // prefer WORD or LINE; many clients want WORD-level results
            // use polygon if present for tighter mask
            const geometry = td.Geometry || {};
            const bbox = geometry.BoundingBox; // relative
            const polygon = geometry.Polygon; // array of {X,Y} relative

            // compute crop area (use bbox extents if polygon not present)
            let relMinX = bbox ? bbox.Left : 0;
            let relMinY = bbox ? bbox.Top : 0;
            let relMaxX = bbox ? (bbox.Left + bbox.Width) : 1;
            let relMaxY = bbox ? (bbox.Top + bbox.Height) : 1;

            if (Array.isArray(polygon) && polygon.length >= 3) {
            for (const p of polygon) {
                relMinX = Math.min(relMinX, p.X);
                relMinY = Math.min(relMinY, p.Y);
                relMaxX = Math.max(relMaxX, p.X);
                relMaxY = Math.max(relMaxY, p.Y);
            }
            }

            // add padding (in pixels)
            const padPx = Math.round(Math.max(4, (relMaxX - relMinX) * imgW * 0.15));
            const left = clamp(Math.floor(relMinX * imgW) - padPx, 0, imgW - 1);
            const top = clamp(Math.floor(relMinY * imgH) - padPx, 0, imgH - 1);
            const right = clamp(Math.ceil(relMaxX * imgW) + padPx, 0, imgW);
            const bottom = clamp(Math.ceil(relMaxY * imgH) + padPx, 0, imgH);
            const width = Math.max(1, right - left);
            const height = Math.max(1, bottom - top);

            // extract the cropped region raw (RGB or RGBA depending)
            const cropObj = await sharp(imgBuf)
            .extract({ left, top, width, height })
            .raw()
            .toBuffer({ resolveWithObject: true });
            const cropData = cropObj.data; // Uint8Array
            const channels = cropObj.info.channels; // usually 3 or 4

            // Build polygon mask (if polygon available) in crop-space.
            // We'll render an SVG mask where polygon area is black (0) and background is white (255)
            // so maskPixel === 0 => inside polygon; >=128 => outside.
            let maskBytes = null; // Uint8Array length width*height
            if (Array.isArray(polygon) && polygon.length >= 3) {
            // polygon points relative to crop
            const points = polygon.map(p => {
                const px = (p.X * imgW) - left;
                const py = (p.Y * imgH) - top;
                // clamp within crop
                const cx = clamp(Math.round(px), 0, width - 1);
                const cy = clamp(Math.round(py), 0, height - 1);
                return `${cx},${cy}`;
            }).join(" ");

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="#ffffff"/>
                <polygon points="${points}" fill="#000000"/>
            </svg>`;

            // render mask as greyscale raw single channel by making greyscale and raw
            const maskBuf = await sharp(Buffer.from(svg))
                .resize(width, height) // ensure exact size
                .greyscale()
                .raw()
                .toBuffer(); // length = width*height, each byte 0..255

            maskBytes = maskBuf;
            } else {
            // fallback: use bounding box as mask (take entire crop as "inside")
            // create mask with entire area = 0 (inside)
            maskBytes = Buffer.alloc(width * height, 0);
            }

            // collect inside (mask<128) and outside (>=128) pixels
            const insidePixels = [];
            const outsidePixels = [];

            const pxCount = width * height;
            for (let i = 0; i < pxCount; i++) {
            const maskVal = maskBytes[i]; // 0..255
            const idx = i * channels;
            const r = cropData[idx];
            const g = cropData[idx + 1];
            const b = cropData[idx + 2];
            if (maskVal < 128) {
                // inside polygon => candidate text pixel
                insidePixels.push({ r, g, b, brightness: brightnessRgb({ r, g, b }) });
            } else {
                outsidePixels.push({ r, g, b, brightness: brightnessRgb({ r, g, b }) });
            }
            }

            // if insidePixels is empty (weird), fallback to using bbox center area as inside
            if (insidePixels.length === 0) {
            // sample center block
            const cx = Math.floor(width / 2);
            const cy = Math.floor(height / 2);
            const sampleW = Math.max(1, Math.floor(width * 0.4));
            const sampleH = Math.max(1, Math.floor(height * 0.4));
            const sx = clamp(cx - Math.floor(sampleW / 2), 0, width - sampleW);
            const sy = clamp(cy - Math.floor(sampleH / 2), 0, height - sampleH);
            for (let yy = sy; yy < sy + sampleH; yy++) {
                for (let xx = sx; xx < sx + sampleW; xx++) {
                const i = yy * width + xx;
                const idx = i * channels;
                insidePixels.push({
                    r: cropData[idx],
                    g: cropData[idx + 1],
                    b: cropData[idx + 2],
                    brightness: brightnessRgb({ r: cropData[idx], g: cropData[idx + 1], b: cropData[idx + 2] })
                });
                }
            }
            }

            // Compute foreground color from darkest pixels inside the polygon:
            // pick darkest 30% (tuneable) to avoid anti-aliased lighter pixels
            insidePixels.sort((a, b) => a.brightness - b.brightness);
            const fgPickFrac = 0.30;
            const pickCount = Math.max(1, Math.round(insidePixels.length * fgPickFrac));
            const fgSubset = insidePixels.slice(0, pickCount);
            const fg = fgSubset.reduce((acc, p) => {
            acc.r += p.r; acc.g += p.g; acc.b += p.b; return acc;
            }, { r: 0, g: 0, b: 0 });
            const fgColor = {
            r: Math.round(fg.r / fgSubset.length),
            g: Math.round(fg.g / fgSubset.length),
            b: Math.round(fg.b / fgSubset.length)
            };

            // Compute background color from outside pixels: use median by channel to avoid outliers
            let bgColor;
            if (outsidePixels.length === 0) {
            // fallback to simple inverse of foreground
            bgColor = {
                r: clamp(255 - fgColor.r, 0, 255),
                g: clamp(255 - fgColor.g, 0, 255),
                b: clamp(255 - fgColor.b, 0, 255)
            };
            } else {
            // median per channel
            const rs = outsidePixels.map(p => p.r).sort((a, b) => a - b);
            const gs = outsidePixels.map(p => p.g).sort((a, b) => a - b);
            const bs = outsidePixels.map(p => p.b).sort((a, b) => a - b);
            const mid = Math.floor(outsidePixels.length / 2);
            bgColor = {
                r: rs[mid],
                g: gs[mid],
                b: bs[mid]
            };
            }

            // compute contrast
            const ratio = contrastRatio(fgColor, bgColor);

            // determine pass/fail
            const passAA = ratio >= threshold;
            const passLarge = ratio >= 3.0;
            const passAAA = ratio >= 7.0;

            reports.push({
            detectedText: td.DetectedText,
            type: td.Type,
            confidence: Math.round(conf),
            boundingBoxRelative: bbox || null,
            polygon: polygon || null,
            boundingBoxPx: { left, top, width, height },
            foreground: fgColor,
            background: bgColor,
            contrastRatio: Number(ratio.toFixed(2)),
            passAA,
            passLarge,
            passAAA
            });

            // if fails -> prepare overlay (padded rect around bounding box for simplicity)
            if (!passAA) {
            // choose white or black overlay such that the overlay -> text color contrast is max
            const blackContrast = contrastRatio(fgColor, { r: 0, g: 0, b: 0 });
            const whiteContrast = contrastRatio(fgColor, { r: 255, g: 255, b: 255 });
            const fill = whiteContrast >= blackContrast ? "#ffffff" : "#000000";

            // overlay rect coordinates (with small pad)
            const rectPad = Math.round(Math.max(6, Math.min(width, height) * 0.2));
            const rx = Math.round(Math.min(12, Math.min(width, height) * 0.2));
            const rLeft = clamp(left - rectPad, 0, imgW);
            const rTop = clamp(top - rectPad, 0, imgH);
            const rWidth = clamp(width + rectPad * 2, 1, imgW - rLeft);
            const rHeight = clamp(height + rectPad * 2, 1, imgH - rTop);

            overlays.push({
                x: rLeft,
                y: rTop,
                width: rWidth,
                height: rHeight,
                rx,
                fill,
                opacity: 0.95
            });
            }
        }

        // if no overlays needed, return JSON report
        if (overlays.length === 0) {
            resolve({ allPass: true, message: "All detected text passes contrast", reports });
        }

        // Build SVG overlay with all rects
        const rectsSvg = overlays.map(o => {
            return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" rx="${o.rx}" ry="${o.rx}" fill="${o.fill}" opacity="${o.opacity}"/>`;
        }).join("\n");

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">${rectsSvg}</svg>`;

        // composite and return fixed image (png)
        const fixedBuf = await sharp(imgBuf)
            .composite([{ input: Buffer.from(svg), blend: "over" }])
            .png()
            .toBuffer();

        resolve({ allPass: false, message: "Fixed image generated", reports, fixedImageBuffer: fixedBuf });
        });
    } catch (err) {
        console.error("Error fixing contrast:", err);
        reject(new Error("Error fixing image contrast."));
    };
}