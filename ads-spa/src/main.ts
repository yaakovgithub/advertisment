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

// (L.Icon.Default as any).mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });
const iconRetinaUrl: string = 'marker-icon-2x.png';
const iconUrl: string = 'marker-icon.png';
const shadowUrl: string = 'marker-shadow.png';
// (L.Icon.Default as any).mergeOptions({
//   iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
//   iconUrl: 'assets/leaflet/marker-icon.png',
//   shadowUrl: 'assets/leaflet/marker-shadow.png',
// });
L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
