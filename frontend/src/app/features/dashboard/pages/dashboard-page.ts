import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  protected readonly authService = inject(AuthService);
  protected readonly user = this.authService.getUser();

  logout(): void {
    this.authService.logout();
  }
}
