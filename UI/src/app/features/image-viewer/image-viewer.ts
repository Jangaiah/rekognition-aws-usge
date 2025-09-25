import { ChangeDetectorRef, Component, Input, NgZone, OnInit } from '@angular/core';
import { VisionAws } from '../../sevices/vision-aws';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-viewer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.scss'
})
export class ImageViewer implements OnInit {
  imageUrl?: string;
  altText: string | null = null;
  formGroup: FormGroup = new FormGroup({
      imageFile: new FormControl(null)
    });
  selectedFile?: File | null = null;

  isLoading: boolean = false;
  showResponse: boolean = false;


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
    this.visionService.generateAltText(formData).subscribe((data) =>{
        this.altText = data.altText;
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
}
