import {Component, OnInit} from '@angular/core';
import {ProjectDB, SupabaseService} from "./supabase.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public projects: ProjectDB[] = [];
  public loading: boolean = true;

  constructor(public supabase: SupabaseService) {
  }

  async ngOnInit() {
    this.projects = await this.supabase.getProjects();
    this.loading = false;
  }
}
