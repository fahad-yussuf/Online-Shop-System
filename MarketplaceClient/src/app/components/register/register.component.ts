import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-container">
      <h2>Register</h2>
      <input [(ngModel)]="name" placeholder="Full name"/>
      <input [(ngModel)]="email" placeholder="Email" type="email"/>
      <input [(ngModel)]="password" placeholder="Password" type="password"/>
      <select [(ngModel)]="role">
        <option [value]="0">Buyer</option>
        <option [value]="1">Seller</option>
      </select>
      <button (click)="register()">Create account</button>
      <p *ngIf="error" class="error">{{ error }}</p>
      <a routerLink="/login">Already have an account? Login</a>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 400px; margin: 100px auto; display: flex; flex-direction: column; gap: 12px; padding: 24px; border: 1px solid #ddd; border-radius: 8px; }
    input, select { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    button { padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: red; font-size: 13px; }
    a { font-size: 13px; text-align: center; color: #555; }
  `]
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role: any = 0;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.auth.register(this.email, this.password, this.name, Number(this.role)).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.error = 'Registration failed. Email may already be in use.'
    });
  }
}