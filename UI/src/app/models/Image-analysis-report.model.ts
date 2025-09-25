export interface ImageAnalysisReport {
    detectedText?: string;
    boundingBoxPx: {
        width: number;
        height: number;
        left: number;
        top: number;
    };
    boundingBoxRelative?: {
        width: number;
        height: number;
        left: number;
        top: number;
    };
    foregroundColor?: { r: number; g: number; b: number };
    backgroundColor?: { r: number; g: number; b: number };
    contrastRatio?: number;
    passAA?: boolean;
    passAAA?: boolean;
    type?: string
    polygon: Array<{ x: number; y: number }>;
}