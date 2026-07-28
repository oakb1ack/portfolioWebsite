import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterLink, RouterOutlet],
})
export class App {
  protected readonly navItems = [
    { label: 'Projects', href: '/projects' },
    { label: 'Blog', href: '/blog' },
    { label: 'Resume', href: '/resume' },
    { label: 'Contact', href: '/contact' },
  ];

  protected readonly profile = {
    name: 'Ali Alfridawi',
    education: 'EE & Math @ UTA',
    role: 'SWE Intern @ IBM',
    statement: 'The best thing you can be is a good person.',
  };
}
