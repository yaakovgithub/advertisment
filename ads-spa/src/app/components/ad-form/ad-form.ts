import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdsService } from '../../services/ads';
import { Ad, AdDto } from '../../models/ad';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
@Component({
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  standalone: true,
  selector: 'app-ad-form',
  templateUrl: './ad-form.html',
  styleUrls: ['./ad-form.scss'],
})
export class AdForm implements OnInit {
  id?: string;
  model: AdDto = {
    title: '',
    description: '',
    category: 'Buy & Sell',
    price: 0,
    imageUrl: '',
    lat: undefined,
    lng: undefined,
  };
  mapCenter = { lat: 32.08, lng: 34.78 }; // default TLV
  marker?: google.maps.LatLngLiteral;

  constructor(private route: ActivatedRoute, private router: Router, private adsSvc: AdsService) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (this.id)
      this.adsSvc.get(this.id).subscribe((a: Ad) => {
        const { title, description, category, price, imageUrl, lat, lng } = a;
        this.model = { title, description, category, price, imageUrl, lat, lng };
        this.marker = lat && lng ? { lat, lng } : undefined;
        if (lat && lng) this.mapCenter = { lat, lng };
      });
  }

  mapClick(e: google.maps.MapMouseEvent) {
    if (!e.latLng) return;
    this.marker = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    this.model.lat = this.marker.lat;
    this.model.lng = this.marker.lng;
  }

  save() {
    const op = this.id ? this.adsSvc.update(this.id, this.model) : this.adsSvc.create(this.model);
    op.subscribe(() => this.router.navigateByUrl('/'));
  }
}
