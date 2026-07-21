import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    NgIf
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  showPassword = false;


  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}