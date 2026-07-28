import { Component, input } from '@angular/core';
import { ProjectStatus } from '../../models/project.model';

@Component({
  selector: 'app-project-meta',
  templateUrl: './project-meta.component.html',
  styleUrl: './project-meta.component.scss',
})
export class ProjectMetaComponent {
  readonly status = input.required<ProjectStatus>();
  readonly availability = input<'public' | 'private'>();
}
