import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminAuthService } from '../core/admin-auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly signingOut = signal(false);

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    if (this.signingOut()) {
      return;
    }
    this.signingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe(() => void this.router.navigate(['/admin/login']));
  }
}
