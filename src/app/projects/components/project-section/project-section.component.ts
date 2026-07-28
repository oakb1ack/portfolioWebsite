import { Component, input } from '@angular/core';
import { ProjectSection } from '../../models/project.model';

@Component({
  selector: 'app-project-section',
  templateUrl: './project-section.component.html',
  styleUrl: './project-section.component.scss',
})
export class ProjectSectionComponent {
  readonly section = input.required<ProjectSection>();
}
