import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdFormDialog } from '../ad-form-dialog/ad-form-dialog';
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
  constructor(public adsSvc: AdsService, private router: Router, private dialog: MatDialog) {}
  openAdForm(id?: string) {
    this.dialog
      .open(AdFormDialog, {
        width: '640px',
        maxWidth: '95vw',
        data: { id },
        disableClose: true,
        panelClass: 'ad-form-dialog-panel',
      })
      .afterClosed()
      .subscribe(() => {
        this.adsSvc.list().subscribe();
      });
  }

  ngOnInit() {
    this.adsSvc.ads$.subscribe((a) => (this.ads = a));
    this.adsSvc.list().subscribe();
    this.search();
  }
  ngOnDestroy(): void {
    this.map?.remove();
  }
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const response = await fetch(url);
    const results = await response.json();
    if (results.length > 0) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
    return null;
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

  async search() {
    // Only send category/price filters to backend
    const f: any = {
      category: this.category,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
    };
    await this.adsSvc.list(f).toPromise();
    let filteredAds = this.adsSvc.ads$.getValue();
    // Location/proximity filtering in frontend
    if (this.q.trim()) {
      const geo = await this.geocodeAddress(this.q.trim());
      if (geo) {
        const radiusKm = 20;
        filteredAds = filteredAds.filter((ad) => {
          if (ad.lat != null && ad.lng != null) {
            const dist = this.getDistanceKm(geo.lat, geo.lng, ad.lat, ad.lng);
            return dist <= radiusKm;
          }
          if (ad.address) {
            return ad.address.toLowerCase().includes(this.q.trim().toLowerCase());
          }
          return false;
        });
      } else {
        filteredAds = filteredAds.filter(
          (ad) => ad.address && ad.address.toLowerCase().includes(this.q.trim().toLowerCase())
        );
      }
    }
    // Near me filtering
    if (this.nearMe && this.me) {
      const lat = this.me.coords.latitude;
      const lng = this.me.coords.longitude;
      const radiusKm = this.radius / 1000;
      filteredAds = filteredAds.filter((ad) => {
        if (ad.lat != null && ad.lng != null) {
          const dist = this.getDistanceKm(lat, lng, ad.lat, ad.lng);
          return dist <= radiusKm;
        }
        return false;
      });
    }
    this.ads = filteredAds;
  }

  // search() {
  //   const f: any = {
  //     q: this.q,
  //     category: this.category,
  //     minPrice: this.minPrice,
  //     maxPrice: this.maxPrice,
  //   };
  //   if (this.nearMe && this.me) {
  //     f.lat = this.me.coords.latitude;
  //     f.lng = this.me.coords.longitude;
  //     f.radiusMeters = this.radius;
  //   }
  //   this.adsSvc.list(f).subscribe();
  // }

  edit(a: Ad) {
    this.router.navigate(['/edit', a.id]);
  }
  create() {
    this.router.navigate(['/new']);
  }
  remove(a: Ad) {
    if (confirm('Delete this ad?')) this.adsSvc.remove(a.id).subscribe(() => this.search());
  }
  getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
