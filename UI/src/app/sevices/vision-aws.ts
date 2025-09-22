import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisionAws {
  constructor(private http: HttpClient) {}

  generateAltText(file: File | Blob) {
    return this.http.post<{ altText: string }>(
      'http://localhost:3000/api/generate-alt',
      file,
      {
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      }
    );
  }
}
