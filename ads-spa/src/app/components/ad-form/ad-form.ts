// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { AdsService } from '../../services/ads';
// import { Ad, AdDto } from '../../models/ad';
// import { FormsModule } from '@angular/forms';
// import { GoogleMapsModule } from '@angular/google-maps';
// import { CommonModule } from '@angular/common';
// @Component({
//   imports: [CommonModule, FormsModule, GoogleMapsModule],
//   standalone: true,
//   selector: 'app-ad-form',
//   templateUrl: './ad-form.html',
//   styleUrls: ['./ad-form.scss'],
// })
// export class AdForm implements OnInit {
//   id?: string;
//   model: AdDto = {
//     title: '',
//     description: '',
//     category: 'Buy & Sell',
//     price: 0,
//     imageUrl: '',
//     lat: undefined,
//     lng: undefined,
//   };
//   mapCenter = { lat: 32.08, lng: 34.78 }; // default TLV
//   marker?: google.maps.LatLngLiteral;

//   constructor(private route: ActivatedRoute, private router: Router, private adsSvc: AdsService) {}

//   ngOnInit() {
//     this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
//     if (this.id)
//       this.adsSvc.get(this.id).subscribe((a: Ad) => {
//         const { title, description, category, price, imageUrl, lat, lng } = a;
//         this.model = { title, description, category, price, imageUrl, lat, lng };
//         this.marker = lat && lng ? { lat, lng } : undefined;
//         if (lat && lng) this.mapCenter = { lat, lng };
//       });
//   }

//   mapClick(e: google.maps.MapMouseEvent) {
//     if (!e.latLng) return;
//     this.marker = { lat: e.latLng.lat(), lng: e.latLng.lng() };
//     this.model.lat = this.marker.lat;
//     this.model.lng = this.marker.lng;
//   }

//   save() {
//     const op = this.id ? this.adsSvc.update(this.id, this.model) : this.adsSvc.create(this.model);
//     op.subscribe(() => this.router.navigateByUrl('/'));
//   }
// }

import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

import { AdsService } from '../../services/ads';
import { Ad, AdDto } from '../../models/ad';

@Component({
  selector: 'app-ad-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ad-form.html',
})
export class AdForm implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adsSvc = inject(AdsService);

  id?: string;
  model: AdDto = { title: '', description: '', category: 'Buy & Sell', price: 0 };

  // Leaflet
  private map?: L.Map;
  private marker?: L.Marker;
  private defaultCenter: L.LatLngExpression = [32.08, 34.78]; // TLV

  ngAfterViewInit() {
    this.initMap();
    setTimeout(() => this.map!.invalidateSize(), 0); // 👈 important
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.id) {
      this.adsSvc.get(this.id).subscribe((a: Ad) => {
        const { title, description, category, price, imageUrl, lat, lng } = a;
        this.model = { title, description, category, price, imageUrl, lat, lng };
        if (lat != null && lng != null) {
          this.setMarker([lat, lng]);
          this.map!.setView([lat, lng], 12);
        }
      });
    }
  }

  private initMap() {
    this.map = L.map('ad-form-map').setView(this.defaultCenter, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng);
      this.model.lat = e.latlng.lat;
      this.model.lng = e.latlng.lng;
    });
  }

  private setMarker(latlng: L.LatLngExpression) {
    if (!this.map) return;
    if (this.marker) this.marker.setLatLng(latlng);
    else this.marker = L.marker(latlng).addTo(this.map);
  }

  save() {
    const op = this.id ? this.adsSvc.update(this.id!, this.model) : this.adsSvc.create(this.model);
    op.subscribe(() => this.router.navigateByUrl('/'));
  }
}
