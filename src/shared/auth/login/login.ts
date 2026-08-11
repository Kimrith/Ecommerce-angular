import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auths } from '../../../Service/Auth/auths';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showPassword = false;

  credentials = {
    email: '',
    password: ''
  };

  constructor(private authsService: Auths, private router: Router) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    this.authsService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful', response);

        const userRole = response.role || (response.user && response.user.role);

        // Save token and user data for everyone upon successful authentication
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response));

        // Redirect based on user role
        if (userRole === 'Customer') {
          this.router.navigate(['/']);
          return;
        }

        if (userRole === 'Seller') {
          this.router.navigate(['/sellers']);
          return;
        }

        if (userRole === 'Admin') {
          this.router.navigate(['/admin']);
          return;
        }

        // Fallback if role is unrecognized
        alert('Unauthorized role type.');
      },
      error: (error) => {
        console.error('Login failed', error);
        alert('Wrong email or password.');
      }
    });
  }
}