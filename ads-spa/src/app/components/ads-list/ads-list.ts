import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { AdFormDialog } from '../ad-form-dialog/ad-form-dialog';
import { AdsService } from '../../services/ads';
import { Ad } from '../../models/ad';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
@Component({
  imports: [CommonModule, FormsModule],
  standalone: true,
  selector: 'app-ads-list',
  templateUrl: './ads-list.html',
  styleUrls: ['./ads-list.scss'],
})
export class AdsList implements OnInit {
  currentUser: string = '';
  q = '';
  category = '';
  minPrice?: number;
  maxPrice?: number;
  nearMe = false;
  radius = 3000; // meters
  me?: GeolocationPosition;

  ads: Ad[] = [];

  private map?: L.Map;

  private meMarker?: L.Marker;

  private meCircle?: L.Circle;
  constructor(
    public adsSvc: AdsService,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService
  ) {
    this.userService.currentUser$.subscribe((u) => {
      this.currentUser = u?.username || '';
    });
  }
  openAdForm(id?: string) {
    if (!this.currentUser) return;
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
  getCityName(address: string): string {
    if (!address) return '';
    const parts = address.split(',').map((s) => s.trim());
    // Heuristic: city is usually the 3rd or 4th part in Nominatim addresses
    // Try to find a part that looks like a city (not a street, not a number)
    for (let i = 2; i < Math.min(parts.length, 6); i++) {
      if (/^[A-Za-z\u0590-\u05FF\s'-]+$/.test(parts[i]) && parts[i].length > 2) {
        return parts[i];
      }
    }
    // Fallback: return the last part
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
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

  async toggleNearMe() {
    if (!this.nearMe) {
      this.nearMe = true;
      setTimeout(() => this.ensureMap(), 0); // make sure map exists after DOM shows
      navigator.geolocation.getCurrentPosition(
        async (p) => {
          this.me = p;

          // this.ensureMap();

          const latlng: L.LatLngExpression = [p.coords.latitude, p.coords.longitude];
          // this.q = latlng.toString();

          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.coords.latitude}&lon=${p.coords.longitude}`;
          try {
            const response = await fetch(url);
            const result = await response.json();
            if (result && result.display_name) {
              this.q = result.display_name;
            } else {
              this.q = '';
            }
          } catch {
            this.q = '';
          }

          this.map!.setView(latlng, 13);

          if (this.meMarker) this.meMarker.setLatLng(latlng);
          else this.meMarker = L.marker(latlng).addTo(this.map!);

          if (this.meCircle) this.meCircle.setLatLng(latlng).setRadius(this.radius);
          else this.meCircle = L.circle(latlng, { radius: this.radius }).addTo(this.map!);
          this.map!.invalidateSize();
          this.search();
        },
        (_) => {
          this.nearMe = false;
          alert('Location permission denied.');
        }
      );
    } else {
      this.nearMe = false;
      this.q = '';
      this.map?.remove();
      this.map = undefined;
      this.meMarker = undefined;
      this.meCircle = undefined;

      this.search();
    }
  }

  async search() {
    let filteredAds = this.adsSvc.ads$.getValue();
    // Filter by category or 'My Posts'
    if (this.category) {
      if (this.category === 'my-posts' && this.currentUser) {
        filteredAds = filteredAds.filter((ad) => ad.username === this.currentUser);
      } else {
        filteredAds = filteredAds.filter((ad) => ad.category === this.category);
      }
    }
    // Filter by min price
    if (typeof this.minPrice === 'number' && !isNaN(this.minPrice)) {
      filteredAds = filteredAds.filter(
        (ad) => ad.price != null && typeof ad.price === 'number' && ad.price >= this.minPrice!
      );
    }
    // Filter by max price
    if (typeof this.maxPrice === 'number' && !isNaN(this.maxPrice)) {
      filteredAds = filteredAds.filter(
        (ad) => ad.price != null && typeof ad.price === 'number' && ad.price <= this.maxPrice!
      );
    }
    // Filter by location/q
    if (this.q.trim()) {
      const geo = await this.geocodeAddress(this.q.trim());
      if (geo) {
        // Filter ads within 20km of the geocoded location
        const radiusKm = 20;
        filteredAds = filteredAds.filter((ad) => {
          if (ad.lat != null && ad.lng != null) {
            const dist = this.getDistanceKm(geo.lat, geo.lng, ad.lat, ad.lng);
            return dist <= radiusKm;
          }
          // Optionally match address string if ad has no lat/lng
          if (ad.address) {
            return ad.address.toLowerCase().includes(this.q.trim().toLowerCase());
          }
          return false;
        });
      } else {
        // Optionally match address string if geocoding fails
        filteredAds = filteredAds.filter(
          (ad) => ad.address && ad.address.toLowerCase().includes(this.q.trim().toLowerCase())
        );
      }
    }
    this.ads = filteredAds;
  }

  edit(a: Ad) {
    if (a.username === this.currentUser) {
      this.router.navigate(['/edit', a.id]);
    }
  }
  create() {
    if (this.currentUser) {
      this.router.navigate(['/new']);
    }
  }
  remove(a: Ad) {
    if (a.username === this.currentUser && confirm('Delete this ad?')) {
      this.adsSvc.remove(a.id).subscribe(() => this.search());
    }
  }
  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
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
