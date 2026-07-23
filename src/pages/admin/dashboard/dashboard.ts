import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {

  @ViewChild('salesChart') salesChart!: ElementRef;

  @ViewChild('orderChart') orderChart!: ElementRef;

  ngAfterViewInit() {

    new Chart(this.salesChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
          {
            label: 'Revenue',
            data: [12000,18000,15000,25000,30000,42000],
            borderWidth: 3,
            tension: 0.4
          }
        ]
      }
    });

    new Chart(this.orderChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed','Pending','Cancelled'],
        datasets: [
          {
            data: [820,120,60],
            borderWidth: 1
          }
        ]
      }
    });

  }
}