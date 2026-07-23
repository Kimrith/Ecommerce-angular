import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-report',
  imports: [],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements AfterViewInit {

  @ViewChild('salesChart') salesChart!: ElementRef;
  @ViewChild('orderChart') orderChart!: ElementRef;

  ngAfterViewInit() {

    new Chart(this.salesChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [
          {
            label: 'Sales Revenue',
            data: [45000,52000,48000,75000,90000,120000],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    new Chart(this.orderChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed','Pending','Cancelled'],
        datasets: [
          {
            data: [8500,1200,300],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  }

}