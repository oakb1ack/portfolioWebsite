import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectSectionComponent } from '../../components/project-section/project-section.component';
import { ProjectMetaComponent } from '../../components/project-meta/project-meta.component';
import { projects } from '../../data/projects.data';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectMetaComponent, ProjectSectionComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly project = projects.find(
    (candidate) => candidate.slug === this.route.snapshot.paramMap.get('slug'),
  );
}
