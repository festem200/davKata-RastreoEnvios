import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  protected readonly authService = inject(AuthService);
  protected readonly user = this.authService.getUser();

  logout(): void {
    this.authService.logout();
  }
}
