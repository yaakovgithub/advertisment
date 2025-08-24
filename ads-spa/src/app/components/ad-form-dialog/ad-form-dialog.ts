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
    <div
      style="display: flex; align-items: center; padding: 0.5rem 1rem 0.5rem 1rem; border-bottom: 1px solid #eee; background: #fafbfc;"
    >
      <span
        style="font-size: 1.2rem; font-weight: 600; letter-spacing: 0.5px; color: #1976d2; flex: 1;"
        >{{ data.id ? 'Edit Ad' : 'Add New Ad' }}</span
      >
    </div>
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
