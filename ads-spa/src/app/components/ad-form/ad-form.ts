import { Component, inject, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

import { AdsService } from '../../services/ads';
import { Ad, AdDto } from '../../models/ad';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-ad-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ad-form.html',
})
export class AdForm implements AfterViewInit {
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adsSvc = inject(AdsService);
  @Input() id?: string;
  @Output() close = new EventEmitter<void>();
  model: AdDto = { title: '', description: '', category: 'Buy & Sell', price: 0, address: '' };

  private map?: L.Map;
  private marker?: L.Marker;
  private defaultCenter: L.LatLngExpression = [32.08, 34.78]; // TLV

  ngAfterViewInit() {
    this.initMap();
    setTimeout(() => this.map!.invalidateSize(), 0);
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
    // Set username for new ads
    if (!this.id) {
      const user = this.userService.getCurrentUser();
      if (user) {
        this.model.username = user.username;
      }
    }
    const op = this.id ? this.adsSvc.update(this.id!, this.model) : this.adsSvc.create(this.model);
    op.subscribe(() => {
      this.close.emit();
      this.router.navigateByUrl('/dashboard');
    });
  }
}
