import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VisionAws } from '../../services/vision-aws';
import { ImageAnalysisReport } from '../../models/Image-analysis-report.model';
import { Util } from '../../services/util';

@Component({
  selector: 'app-image-contrast',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './image-contrast.html',
  styleUrl: './image-contrast.scss'
})
export class ImageContrast {
  imageUrl?: string;
  message: string | null = null;
  formGroup: FormGroup = new FormGroup({
      imageFile: new FormControl(null)
    });
  selectedFile?: File | null = null;

  isLoading: boolean = false;
  showResponse: boolean = false;
  responseImageUrl?: string;
  reports: ImageAnalysisReport[] = [];
  imgWidth: number = 0;
  imgHeight: number = 0;
  originalImageWidth: number = 0;
  originalImageHeight: number = 0;

  @ViewChild('imageRef') imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  private visionService: VisionAws = inject(VisionAws);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private util: Util = inject(Util);

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.resetResults();
      this.selectedFile = event.target.files[0];

      const imgOriginal = await this.util.getImageOriginalWidthAndHeight(this.selectedFile as File);
      this.originalImageWidth = imgOriginal.width;
      this.originalImageHeight = imgOriginal.height;

      const reader = new FileReader();
      reader.onload = () => {
          this.imageUrl = reader.result as string;
          this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedFile as File);
    }
  }

  resetResults() {
    this.showResponse = false;
    this.message = null;
    this.responseImageUrl = undefined;
    this.imgWidth = 0;
    this.imgHeight = 0;
    this.reports = [];
  }


  onSubmit() {
    const formData = new FormData();
    formData.append('file', this.selectedFile as File);
    
    this.isLoading = true;
    this.showResponse = false;
    this.visionService.enhanceContrast(formData).subscribe((imagedata) =>{
      if(imagedata?.fixedImageBuffer) {
        const binary = imagedata?.fixedImageBuffer?.data.map((b:number) => String.fromCharCode(b)).join('');
      this.responseImageUrl = `data:image/png;base64,${btoa(binary)}`
      }
      this.message = imagedata.message;
      this.reports = imagedata.reports.filter((r: ImageAnalysisReport) => r.type === 'LINE');
      
      this.isLoading = false;
      this.showResponse = true;
      this.cdr.markForCheck();
    },
    (error) => {
      console.error('Error generating alt text:', error);
      this.isLoading = false;
      this.showResponse = false;
      this.cdr.markForCheck();
    });
  }

  onResponseImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.imgWidth = img.clientWidth;   // or  if scaled
    this.imgHeight = img.clientHeight;

    this.util.drawOverLaysOnCanvas(
      this.canvasRef, 
      this.imgWidth, this.imgHeight, 
      this.originalImageWidth, this.originalImageHeight, 
      this.reports);
  }

}
