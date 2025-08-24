// Geocode address and set lat/lng

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

import { Component, inject, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() id?: string;
  @Output() close = new EventEmitter<void>();
  // id?: string;
  model: AdDto = { title: '', description: '', category: 'Buy & Sell', price: 0, address: '' };
  // Geocode address and set lat/lng
  // async useAddress() {
  //   if (!this.model.address || !this.model.address.trim()) return;
  //   const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.model.address)}`;
  //   const response = await fetch(url);
  //   const results = await response.json();
  //   if (results.length > 0) {
  //     this.model.lat = parseFloat(results[0].lat);
  //     this.model.lng = parseFloat(results[0].lon);
  //     if (this.map) {
  //       this.setMarker([this.model.lat, this.model.lng]);
  //       this.map.setView([this.model.lat, this.model.lng], 12);
  //     }
  //   }
  // }

  // Leaflet
  private map?: L.Map;
  private marker?: L.Marker;
  private defaultCenter: L.LatLngExpression = [32.08, 34.78]; // TLV

  ngAfterViewInit() {
    this.initMap();
    setTimeout(() => this.map!.invalidateSize(), 0); // 👈 important
    // Only use @Input() id, do not overwrite with route param
    if (this.id) {
      this.adsSvc.get(this.id).subscribe((a: Ad) => {
        const { title, description, category, price, imageUrl, lat, lng, address } = a;
        this.model = {
          title,
          description,
          category,
          price,
          imageUrl,
          lat,
          lng,
          address: address || '',
        };
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

    this.map.on('click', async (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng);
      this.model.lat = e.latlng.lat;
      this.model.lng = e.latlng.lng;
      // Reverse geocode to get address
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`;
      try {
        const response = await fetch(url);
        const result = await response.json();
        if (result && result.display_name) {
          this.model.address = result.display_name;
        } else {
          this.model.address = '';
        }
      } catch {
        this.model.address = '';
      }
    });
  }
  cancel() {
    this.close.emit();
  }
  async useAddress() {
    if (!this.model.address || !this.model.address.trim()) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      this.model.address
    )}`;
    const response = await fetch(url);
    const results = await response.json();
    if (results.length > 0) {
      this.model.lat = parseFloat(results[0].lat);
      this.model.lng = parseFloat(results[0].lon);
      if (this.map) {
        this.setMarker([this.model.lat, this.model.lng]);
        this.map.setView([this.model.lat, this.model.lng], 12);
      }
    }
  }
  private setMarker(latlng: L.LatLngExpression) {
    if (!this.map) return;
    if (this.marker) this.marker.setLatLng(latlng);
    else this.marker = L.marker(latlng).addTo(this.map);
  }

  save() {
    // Ensure address is included in the model
    const op = this.id ? this.adsSvc.update(this.id!, this.model) : this.adsSvc.create(this.model);
    op.subscribe(() => {
      this.close.emit();
      this.router.navigateByUrl('/');
    });
  }
}
