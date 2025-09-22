import AWS from 'aws-sdk';
import { Jimp } from 'jimp';
import { contrastRatio, getAverageColor } from '../utils/util.js';
import dotenv from "dotenv";

dotenv.config();

const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// ---------- Main function ----------
export async function checkContrast(bucket, key) {
  // Load image from S3
  const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const image = await Jimp.read(obj.Body);
  const { width, height } = image.bitmap;

  // Rekognition text detection
  const rekRes = await rekognition
    .detectText({ Image: { S3Object: { Bucket: bucket, Name: key } } })
    .promise();

  const results = [];

  for (const text of rekRes.TextDetections) {
    if (text.Type !== "WORD") continue;

    const box = text.Geometry.BoundingBox;
    const left = Math.floor(box.Left * width);
    const top = Math.floor(box.Top * height);
    const w = Math.floor(box.Width * width);
    const h = Math.floor(box.Height * height);

    // Foreground (text color) — sample inside bounding box
    const fg = await getAverageColor(image, left, top, w, h);

    // Background — sample area around bounding box
    const bgX = Math.max(0, left - 5);
    const bgY = Math.max(0, top - 5);
    const bgW = Math.min(width, left + w + 5) - bgX;
    const bgH = Math.min(height, top + h + 5) - bgY;
    const bg = await getAverageColor(image, bgX, bgY, bgW, bgH);

    const ratio = contrastRatio(fg, bg);

    results.push({
      DetectedText: text.DetectedText,
      ForegroundColor: fg,
      BackgroundColor: bg,
      ContrastRatio: ratio.toFixed(2),
      PassAA: ratio >= 4.5,
    });
  }

  return results;
}

export async function adjustImageContrast(bucket, key) {
  // Load image
  const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const image = await Jimp.read(obj.Body);
  const { width, height } = image.bitmap;

  // Detect text
  const rekRes = await rekognition
    .detectText({ Image: { S3Object: { Bucket: bucket, Name: key } } })
    .promise();

  for (const text of rekRes.TextDetections) {
    if (text.Type !== "WORD") continue;

    const box = text.Geometry.BoundingBox;
    const left = Math.floor(box.Left * width);
    const top = Math.floor(box.Top * height);
    const w = Math.floor(box.Width * width);
    const h = Math.floor(box.Height * height);

    const fg = await getAverageColor(image, left, top, w, h);
    const bg = await getAverageColor(
      image,
      Math.max(0, left - 5),
      Math.max(0, top - 5),
      Math.min(width, left + w + 5) - Math.max(0, left - 5),
      Math.min(height, top + h + 5) - Math.max(0, top - 5)
    );

    let ratio = contrastRatio(fg, bg);

    if (ratio < 4.5) {
      // Adjust text region brightness until ratio >= 4.5
      let factor = ratio < 1 ? 1.2 : 0.8; // brighten or darken
      for (let i = 0; i < 10 && ratio < 4.5; i++) {
        image.scan(left, top, w, h, function (x, y, idx) {
          this.bitmap.data[idx] = Math.min(255, this.bitmap.data[idx] * factor);     // R
          this.bitmap.data[idx+1] = Math.min(255, this.bitmap.data[idx+1] * factor); // G
          this.bitmap.data[idx+2] = Math.min(255, this.bitmap.data[idx+2] * factor); // B
        });
        const newFg = await getAverageColor(image, left, top, w, h);
        ratio = contrastRatio(newFg, bg);
      }
    }
  }

  // Save adjusted image back to S3
  const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
  await s3.putObject({
    Bucket: bucket,
    Key: `adjusted/${key}`,
    Body: buffer,
    ContentType: "image/png"
  }).promise();

  return `s3://${bucket}/adjusted/${key}`;
}

// module.exports = { checkContrast, adjustImageContrast };