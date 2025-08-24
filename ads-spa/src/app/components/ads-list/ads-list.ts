import { Component, OnInit } from '@angular/core';
import { AdsService } from '../../services/ads';
import { Ad } from '../../models/ad';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
@Component({
  imports: [CommonModule, FormsModule, GoogleMapsModule],
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

  constructor(public adsSvc: AdsService, private router: Router) {}

  ngOnInit() {
    this.adsSvc.ads$.subscribe((a) => (this.ads = a));
    this.search();
  }

  toggleNearMe() {
    if (!this.nearMe) {
      this.nearMe = true;
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.me = p;
          this.search();
        },
        (_) => {
          this.nearMe = false;
          alert('Location permission denied.');
        }
      );
    } else {
      this.nearMe = false;
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
    if (confirm('Delete this ad?')) this.adsSvc.remove(a.id).subscribe();
  }
}
