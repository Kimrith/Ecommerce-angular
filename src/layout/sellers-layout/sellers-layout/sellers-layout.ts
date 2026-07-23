import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sellers-layout',
  imports: [
    Sidebar,
    Navbar,
    Footer,
    RouterOutlet
  ],
  templateUrl: './sellers-layout.html',
  styleUrl: './sellers-layout.css',
})
export class SellersLayout {}
