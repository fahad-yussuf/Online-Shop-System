import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-container">
      <h2>Login</h2>
      <input [(ngModel)]="email" placeholder="Email" type="email"/>
      <input [(ngModel)]="password" placeholder="Password" type="password"/>
      <button (click)="login()">Login</button>
      <p *ngIf="error" class="error">{{ error }}</p>
      <a routerLink="/register">Don't have an account? Register</a>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 400px; margin: 100px auto; display: flex; flex-direction: column; gap: 12px; padding: 24px; border: 1px solid #ddd; border-radius: 8px; }
    input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    button { padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: red; font-size: 13px; }
    a { font-size: 13px; text-align: center; color: #555; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
      const role = this.auth.getRole();
      if (role === 'Seller') this.router.navigate(['/seller']);
      else if (role === 'Admin') this.router.navigate(['/admin']);
      else this.router.navigate(['/store']);
    },
      error: () => this.error = 'Invalid email or password'
    });
  }
}