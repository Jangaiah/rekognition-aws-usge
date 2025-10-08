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
    foreground?: { r: number; g: number; b: number };
    background?: { r: number; g: number; b: number };
    contrastRatio?: number;
    passAA?: boolean;
    passAAA?: boolean;
    type?: string
    polygon: Array<{ X: number; Y: number }>;
}