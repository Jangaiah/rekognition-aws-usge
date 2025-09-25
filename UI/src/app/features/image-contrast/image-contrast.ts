import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VisionAws } from '../../sevices/vision-aws';
import { ImageAnalysisReport } from '../../models/Image-analysis-report.model';

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


  constructor(private visionService: VisionAws, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
  }

   onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];

      const reader = new FileReader();
      reader.onload = () => {
          this.imageUrl = reader.result as string;
          this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedFile as File);
    }
  }


  onSubmit() {
    const formData = new FormData();
    formData.append('file', this.selectedFile as File);
    
    this.isLoading = true;
    this.showResponse = false;
    this.visionService.enhanceContrast(formData).subscribe((imagedata) =>{
      console.log('Image data received', imagedata);
      if(imagedata?.fixedImageBuffer) {
        const binary = imagedata?.fixedImageBuffer?.data.map((b:number) => String.fromCharCode(b)).join('');
      this.responseImageUrl = `data:image/png;base64,${btoa(binary)}`
      }
      this.message = imagedata.message;
      this.reports = imagedata.reports;
      
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
  }

  getPolygonPoints(polygon: {x: number, y: number}[]) {
    return polygon.map(p => `${p.x * this.imgWidth},${p.y * this.imgHeight}`);
  }

}
