import { Component, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdForm } from '../ad-form/ad-form';

import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-ad-form-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, AdForm],
  template: `
    <h2 mat-dialog-title>{{ data.id ? 'Edit Ad' : 'Add New Ad' }}</h2>
    <app-ad-form [id]="data.id" (close)="onClose()"></app-ad-form>
  `,
})
export class AdFormDialog implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<AdFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string }
  ) {}

  ngOnInit() {
    this.dialogRef.keydownEvents().subscribe((e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.onClose();
      }
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}