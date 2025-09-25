import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'image-alt-text', pathMatch: 'full' },
    { path: 'image-alt-text', loadComponent: () => import('./features/image-viewer/image-viewer').then(m => m.ImageViewer) },
    { path: 'image-contrast', loadComponent: () => import('./features/image-contrast/image-contrast').then(m => m.ImageContrast) },
];
