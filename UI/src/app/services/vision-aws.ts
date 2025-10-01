import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisionAws {
  constructor(private http: HttpClient) {}

  generateAltText(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/api/generate-alt', formData);
  }
  enhanceContrast(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/api/enhance-contrast', formData);
  }
}
