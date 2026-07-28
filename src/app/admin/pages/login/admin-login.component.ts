import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminAuthService } from '../../core/admin-auth.service';
import { toAdminError } from '../../core/admin-error';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent implements OnInit {
  private readonly auth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.get('reason') === 'expired');
  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1024)],
    }),
  });

  ngOnInit(): void {
    this.auth.restoreSession().subscribe((authenticated) => {
      if (authenticated) {
        void this.router.navigateByUrl(this.returnUrl());
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.sessionExpired.set(false);
    this.submitting.set(true);
    const { username, password } = this.form.getRawValue();
    this.auth
      .login(username, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (error: unknown) => this.error.set(toAdminError(error).message),
      });
  }

  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/admin') && !requested.startsWith('/admin/login')
      ? requested
      : '/admin';
  }
}
