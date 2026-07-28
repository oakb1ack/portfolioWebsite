import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly profile = {
    name: 'Ali Alfridawi',
    education: 'EE & Math @ UTA',
    role: 'SWE Intern @ IBM',
    statement: 'The best thing you can be is a good person.',
  };
}
