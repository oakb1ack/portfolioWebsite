import { Component } from '@angular/core';
import { ProjectEmptyStateComponent } from '../../components/project-empty-state/project-empty-state.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';
import { projects } from '../../data/projects.data';

@Component({
  selector: 'app-projects-list',
  imports: [ProjectCardComponent, ProjectEmptyStateComponent],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent {
  protected readonly projects = projects;
}
