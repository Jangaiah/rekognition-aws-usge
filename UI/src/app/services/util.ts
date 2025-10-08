import { ElementRef, Injectable } from '@angular/core';
import { ImageAnalysisReport } from '../models/Image-analysis-report.model';

@Injectable({
  providedIn: 'root'
})
export class Util {

  getImageOriginalWidthAndHeight(file: File): Promise<{width: number, height: number}> {
    
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No file provided');
      } else {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(img.src);
        };

        img.src = URL.createObjectURL(file);
        
        img.onerror = (err) => {
          reject(err);
        };
      }
    });
  }

  drawOverLaysOnCanvas(
    canvasRef: ElementRef<HTMLCanvasElement>,
    imageWidth: number, imageHeight: number, 
    originalImageWidth: number, originalImageHeight: number, 
    reports:   ImageAnalysisReport[]) {
    
    const canvasEl = canvasRef.nativeElement;
    const ctx = canvasEl.getContext('2d')!;
    
    canvasEl.width = imageWidth;
    canvasEl.height = imageHeight;
    
    reports
    .filter(r => !r.passAA)
    .forEach((r) => {
      const { left, top, width, height } = r.boundingBoxPx;

      const scaleX = imageWidth / originalImageWidth;
      const scaleY = imageHeight / originalImageHeight;

      const detectedText = r.detectedText ?? '';

      const fontSize = Math.min(
          (height * 0.8),
          (width / Math.max(1, detectedText.length) * 1.1), 40);

      const fg = r.foreground;
      ctx.fillStyle = `rgb(${fg?.r}, ${fg?.g}, ${fg?.b})`;
      ctx.font =  `${fontSize}px Arial`
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Compute the center position of the bounding box
      const centerX = (left * scaleX) + (width * scaleX) / 2;
      const centerY = (top * scaleY) + (height * scaleY) / 2;
      ctx.fillText(detectedText, centerX, centerY);
    });
  }
  
}
