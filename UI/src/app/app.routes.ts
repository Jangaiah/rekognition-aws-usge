import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'image-viewer', pathMatch: 'full' },
    { path: 'image-viewer', loadComponent: () => import('./features/image-viewer/image-viewer').then(m => m.ImageViewer) },
];
