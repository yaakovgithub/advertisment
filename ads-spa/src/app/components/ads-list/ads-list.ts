import { Component, OnInit } from '@angular/core';
import { AdsService } from '../../services/ads';
import { Ad } from '../../models/ad';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import * as L from 'leaflet';
@Component({
  imports: [CommonModule, FormsModule],
  standalone: true,
  selector: 'app-ads-list',
  templateUrl: './ads-list.html',
  styleUrls: ['./ads-list.scss'],
})
export class AdsList implements OnInit {
  q = '';
  category = '';
  minPrice?: number;
  maxPrice?: number;
  nearMe = false;
  radius = 3000; // meters
  me?: GeolocationPosition;

  ads: Ad[] = [];

  // Leaflet mini-map

  private map?: L.Map;

  private meMarker?: L.Marker;

  private meCircle?: L.Circle;
  constructor(public adsSvc: AdsService, private router: Router) {}

  ngOnInit() {
    this.adsSvc.ads$.subscribe((a) => (this.ads = a));
    this.search();
  }
  ngOnDestroy(): void {
    this.map?.remove();
  }

  private ensureMap() {
    if (this.map) return;

    this.map = L.map('nearme-map').setView([32.08, 34.78], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);
    setTimeout(() => this.map!.invalidateSize(), 0);
  }

  toggleNearMe() {
    if (!this.nearMe) {
      this.nearMe = true;
      setTimeout(() => this.ensureMap(), 0); // make sure map exists after DOM shows
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.me = p;

          // this.ensureMap();

          const latlng: L.LatLngExpression = [p.coords.latitude, p.coords.longitude];

          this.map!.setView(latlng, 13);

          if (this.meMarker) this.meMarker.setLatLng(latlng);
          else this.meMarker = L.marker(latlng).addTo(this.map!);

          if (this.meCircle) this.meCircle.setLatLng(latlng).setRadius(this.radius);
          else this.meCircle = L.circle(latlng, { radius: this.radius }).addTo(this.map!);
          this.map!.invalidateSize(); // 👈 important
          this.search();
        },
        (_) => {
          this.nearMe = false;
          alert('Location permission denied.');
        }
      );
    } else {
      this.nearMe = false;

      this.map?.remove();
      this.map = undefined;
      this.meMarker = undefined;
      this.meCircle = undefined;

      this.search();
    }
  }

  search() {
    const f: any = {
      q: this.q,
      category: this.category,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
    };
    if (this.nearMe && this.me) {
      f.lat = this.me.coords.latitude;
      f.lng = this.me.coords.longitude;
      f.radiusMeters = this.radius;
    }
    this.adsSvc.list(f).subscribe();
  }

  edit(a: Ad) {
    this.router.navigate(['/edit', a.id]);
  }
  create() {
    this.router.navigate(['/new']);
  }
  remove(a: Ad) {
    if (confirm('Delete this ad?')) this.adsSvc.remove(a.id).subscribe(() => this.search());
  }
}
