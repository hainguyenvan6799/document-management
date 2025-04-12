import { Routes } from '@angular/router';
import { HomeComponent } from './share/home/home.component';

export const routes: Routes = [
  { pathMatch: 'full', redirectTo: '', path: '' },
  { path: '', component: HomeComponent },
  {
    path: 'add-document',
    loadComponent: () =>
      import('./partial/add-document/add-document.component').then(
        (com) => com.AddDocumentComponent
      ),
  },
  {
    path: 'modify-document/:id',
    loadComponent: () =>
      import('./partial/add-document/add-document.component').then(
        (com) => com.AddDocumentComponent
      ),
  },
  {
    path: 'search-document',
    loadComponent: () =>
      import('./partial/search-document/search-document.component').then(
        (com) => com.SearchDocumentComponent
      ),
  },
  {
    path: 'add-outgoing-document',
    loadComponent: () =>
      import(
        './partial/add-outgoing-document/add-outgoing-document.component'
      ).then((com) => com.AddOutgoingDocumentComponent),
  },
  {
    path: 'add-outgoing-document/:id',
    loadComponent: () =>
      import(
        './partial/add-outgoing-document/add-outgoing-document.component'
      ).then((com) => com.AddOutgoingDocumentComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./share/not-found-404/not-found-404.component').then(
        (com) => com.NotFound404Component
      ),
  },
];
