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

export function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export async function getAverageColor(image, x, y, w, h) {
  const crop = image.clone().crop(x, y, w, h);
  const resized = crop.resize(1, 1, Jimp.RESIZE_BILINEAR);
  const hex = resized.getPixelColor(0, 0);
  const { r, g, b } = Jimp.intToRGBA(hex);
  return [r, g, b];
}

// module.exports = { srgbToLinear, relativeLuminance, contrastRatio, getAverageColor };