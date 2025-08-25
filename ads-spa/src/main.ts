import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import * as L from 'leaflet';
const iconRetinaUrl: string = 'marker-icon-2x.png';
const iconUrl: string = 'marker-icon.png';
const shadowUrl: string = 'marker-shadow.png';

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
