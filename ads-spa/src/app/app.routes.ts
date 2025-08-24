import { Routes } from '@angular/router';
import { AdsList } from '../app/components/ads-list/ads-list';
import { AdForm } from '../app/components/ad-form/ad-form';
export const routes: Routes = [
  { path: '', component: AdsList },
  { path: 'new', component: AdForm },
  { path: 'edit/:id', component: AdForm },
  { path: '**', redirectTo: '' },
];
