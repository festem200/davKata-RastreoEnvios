import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loginForm = this.formBuilder.group<LoginForm>({
    email: this.formBuilder.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.control('', [Validators.required])
  });

  submit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  protected hasFieldError(fieldName: keyof LoginForm, errorName: string): boolean {
    const field = this.loginForm.controls[fieldName];
    return field.hasError(errorName) && (field.dirty || field.touched);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Credenciales invalidas';
    }

    return 'Error del servidor';
  }
}
