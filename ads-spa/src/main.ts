import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// import * as L from 'leaflet';

// (L.Icon.Default as any).mergeOptions({
//   iconRetinaUrl: 'marker-icon-2x.png',
//   iconUrl: 'marker-icon.png',
//   shadowUrl: 'marker-shadow.png',
// });
import * as L from 'leaflet';

(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
