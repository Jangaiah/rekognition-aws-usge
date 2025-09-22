import { Component, Input, OnInit } from '@angular/core';
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
  @Input() imageUrl: string = 'assets/images/free-nature-images.jpg';
  altText: string | null = null;
  formGroup: FormGroup = new FormGroup({
      imageFile: new FormControl(null)
    });;


  constructor(private visionService: VisionAws) {}

  ngOnInit() {
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Create URL for image preview
      this.imageUrl = URL.createObjectURL(file);
      
      // Send the file directly as blob
      this.visionService.generateAltText(file).subscribe(res => {
        this.altText = res.altText;
      });
    }
  }
}
