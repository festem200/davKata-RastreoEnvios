import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Shipment } from '../../../core/models/shipment.model';
import { TrackingService } from '../services/tracking.service';

@Component({
  selector: 'app-tracking-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './tracking-page.html',
  styleUrl: './tracking-page.scss'
})
export class TrackingPage {
  protected readonly trackingNumber = signal('DAV123456789');
  protected readonly shipment = signal<Shipment | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(private readonly trackingService: TrackingService) {}

  search(): void {
    const trackingNumber = this.trackingNumber().trim();

    if (!trackingNumber) {
      this.errorMessage.set('Ingresa un numero de guia.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.shipment.set(null);

    this.trackingService.track(trackingNumber).subscribe({
      next: (shipment) => {
        this.shipment.set(shipment);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No encontramos informacion para esa guia.');
        this.isLoading.set(false);
      }
    });
  }
}
