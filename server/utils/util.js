import sharp from "sharp";
import { Jimp } from "jimp";
export function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance([r, g, b]) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export async function getAverageColor(image, x, y, w, h) {
  const crop = image.clone().crop(x, y, w, h);
  const resized = crop.resize(1, 1, Jimp.RESIZE_BILINEAR);
  const hex = resized.getPixelColor(0, 0);
  const { r, g, b } = Jimp.intToRGBA(hex);
  return [r, g, b];
}

export async function avgColor(buf, left, top, width, height) {
  const rgb = await sharp(buf)
    .extract({ left, top, width, height })
    .resize(1, 1)
    .raw()
    .toBuffer();
  return { r: rgb[0], g: rgb[1], b: rgb[2] };
}

// Basic WCAG utils inline (or keep in wcag-utils.js)
function channelToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function luminanceFromRGB({ r, g, b }) {
  return 0.2126 * channelToLinear(r) +
         0.7152 * channelToLinear(g) +
         0.0722 * channelToLinear(b);
}
export function contrastRatio(rgbA, rgbB) {
  const L1 = luminanceFromRGB(rgbA);
  const L2 = luminanceFromRGB(rgbB);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

export function brightnessRgb({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// module.exports = { srgbToLinear, relativeLuminance, contrastRatio, getAverageColor };