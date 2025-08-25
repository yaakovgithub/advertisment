import { Routes } from '@angular/router';
import { AdsList } from '../app/components/ads-list/ads-list';
import { AdForm } from '../app/components/ad-form/ad-form';
import { LoginComponent } from '../app/components/login/login.component';
export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: AdsList },
  { path: 'new', component: AdForm },
  { path: 'edit/:id', component: AdForm },
  { path: '**', redirectTo: '' },
];
