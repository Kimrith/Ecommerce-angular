import { Component, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';


@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {


  ngAfterViewInit(): void {


    new Chart('salesChart', {

      type: 'line',

      data: {

        labels: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun'
        ],

        datasets: [
          {
            label: 'Revenue',

            data: [
              2500,
              4000,
              3200,
              6500,
              5000,
              8500
            ],

            tension: 0.4

          }
        ]

      },


      options: {

        responsive: true,

        maintainAspectRatio: false

      }

    });



    new Chart('orderChart', {

      type: 'doughnut',

      data: {

        labels: [
          'Completed',
          'Pending',
          'Cancelled'
        ],

        datasets: [
          {
            data: [
              75,
              15,
              10
            ]
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