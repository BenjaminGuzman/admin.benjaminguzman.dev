import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {IconType, ProjectDB, SupabaseService, TechnologyDB} from "../supabase.service";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectComponent implements OnInit {
  @Input()
  public project: ProjectDB = null as unknown as ProjectDB;

  public technologies: TechnologyDB[] = [];

  public SEPARATOR: string = "🤨";

  public loading: boolean = false;

  public form: FormGroup;
  public controls: {
    name: FormControl,
    description: FormControl,
    tags: FormControl,
    stack: FormControl,
    links: FormControl
  };

  constructor(private supabase: SupabaseService, private changeDetectorRef: ChangeDetectorRef) {
    this.controls = {
      name: new FormControl(),
      description: new FormControl(),
      tags: new FormControl(),
      stack: new FormControl(),
      links: new FormControl()
    }
    this.form = new FormGroup(this.controls);
  }

  ngOnInit(): void {
    this.controls.name.setValue(this.project.name);
    this.controls.description.setValue(this.project.description);
    this.controls.tags.setValue(this.getTagsStr());
    this.controls.links.setValue(this.getLinksStr());
    this.supabase.getTechnologies().then(t => {
      this.technologies = t;

      const currStackIds = this.project.ProjectStack.map(s => s.Technology.id);
      this.controls.stack.setValue(currStackIds);
    });
  }

  public onSubmit(): void {
    this.loading = true;
    this.changeDetectorRef.markForCheck();

    this.project.name = this.controls.name.value.trim();
    this.project.description = this.controls.description.value.trim();

    const tagsStr: string = this.controls.tags.value.trim();
    this.project.ProjectTag = tagsStr.split(',').map(t => ({tag: t.trim()})).filter(t => t.tag !== "");

    const stackIds: string[] = this.controls.stack.value;

    const linksStr: string = this.controls.links.value.trim();
    this.project.ProjectLink = linksStr.split('\n').map(l => {
      const [name, url, icon, iconType] = l.trim().split(this.SEPARATOR);
      return {
        name: name.trim(),
        url: url.trim(),
        icon: icon.trim(),
        icon_type: iconType.trim() as IconType
      };
    });

    this.supabase.saveProject(this.project, stackIds).finally(() => {
      this.loading = false;
      this.changeDetectorRef.markForCheck();
    });
  }

  public sanitize(str: string): string | undefined{
    str = str.trim();
    if (str.toLowerCase() === "undefined" || str.toLowerCase() === "null")
      return undefined;
    return str;
  }

  public getTagsStr(): string {
    return this.project.ProjectTag.map(t => t.tag).join(", ");
  }

  public getLinksStr(): string {
    return this.project.ProjectLink.map(l => {
      return `${l.name}${this.SEPARATOR}${l.url}${this.SEPARATOR}${l.icon}${this.SEPARATOR}${l.icon_type}`;
    }).join("\n");
  }
}
