import {Injectable} from '@angular/core';
import {createClient, PostgrestError, SupabaseClient} from "@supabase/supabase-js";
import {environment} from "../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  private technologies: TechnologyDB[] = [];

  constructor() {
    const key = prompt("Service Key: ");
    if (!key) {
      alert("💀💀💀💀💀💀💀");
      throw new Error("💀💀💀💀💀💀💀");
    }

    this.supabase = createClient(environment.supabaseUrl, key);
  }

  public async getTechnologies(): Promise<TechnologyDB[]> {
    if (this.technologies.length > 0)
      return this.technologies;

    const {data, error} = await this.supabase
      .from<TechnologyDB>("Technology")
      .select("id, name, acronym, url, icon, icon_type");

    if (error || data === null) {
      alert("Error occurred while fetching from Technology");
      console.error(error);
      return this.technologies;
    }

    this.technologies = data;

    return this.technologies;
  }

  public async getProjects(): Promise<ProjectDB[]> {
    const {data, error} = await this.supabase
      .from<ProjectDB>("Project")
      .select(`
        id,
        name,
        description,
        n_imgs,
        ProjectStack(
          Technology(id)
        ),
        ProjectLink(name, url, icon, icon_type),
        ProjectTag(tag)
      `);

    if (error || data === null) {
      // @ts-ignore
      AppComponent.handleNetworkError(error);
      throw error;
    }

    return data;
  }

  public async saveProject(project: ProjectDB, stackTechIds: string[]) {
    console.log("Saving project...", project, "(ProjectStack is ignored) Stack tech ids: ", stackTechIds);

    let r: {data: any, error: PostgrestError | null};

    // project master //
    r = await this.supabase
      .from<ProjectDB>("Project")
      .update({
        name: project.name,
        description: project.description
      })
      .eq("id", project.id);
    if (r.error) {
      alert("Error occurred during update to Project");
      console.error(r.error);
    } else
      console.log("Project saved");

    // project tag //
    // WARNING: inefficient algorithm, but it'll work. This is also NOT atomic (actually all this method)
    r = await this.supabase
      .from<ProjectTag>("ProjectTag")
      .delete()
      .eq("project_id", project.id); // delete all previous tags
    if (r.error) {
      alert("Error occurred during delete to ProjectTag");
      console.error(r.error);
    } else
      console.log("ProjectTag deleted (this is ok)");

    r = await this.supabase
      .from<ProjectTag>("ProjectTag")
      .upsert(project.ProjectTag.map(t => ({project_id: project.id, tag: t.tag}))); // write new tags
    if (r.error) {
      alert("Error occurred during update to ProjectTag");
      console.error(r.error);
    } else
      console.log("ProjectTag updated");

    // project stack //
    // WARNING: inefficient algorithm, but it'll work. This is also NOT atomic (actually all this method)
    r = await this.supabase
      .from<ProjectStack>("ProjectStack")
      .delete()
      .eq("project_id", project.id); // delete all previous relations
    if (r.error) {
      alert("Error occurred during delete to ProjectStack");
      console.error(r.error);
    } else
      console.log("ProjectStack deleted (this is ok)");

    r = await this.supabase
      .from<ProjectStack>("ProjectStack")
      .upsert(stackTechIds.map(id => ({ project_id: project.id, tech_id: id}))); // write new relations
    if (r.error) {
      alert("Error occurred during update to ProjectStack");
      console.error(r.error);
    } else
      console.log("ProjectStack updated");

    // project link //
    // WARNING: inefficient algorithm, but it'll work. This is also NOT atomic (actually all this method)
    r = await this.supabase
      .from<ProjectLink>("ProjectLink")
      .delete()
      .eq("project_id", project.id); // delete all previous relations
    if (r.error) {
      alert("Error occurred during delete to ProjectLink");
      console.error(r.error);
    } else
      console.log("ProjectLink deleted (this is ok)");

    r = await this.supabase
      .from<ProjectLink>("ProjectLink")
      .upsert(project.ProjectLink.map(l => ({project_id: project.id, icon: l.icon, name: l.name, url: l.url, icon_type: l.icon_type}))); // write new relations
    if (r.error) {
      alert("Error occurred during update to ProjectLink");
      console.error(r.error);
    } else
      console.log("ProjectLink updated");

    alert("👏 Data was saved successfully 👌")
    // return data;
  }
}

export enum IconType {
  class = "class",
  img = "img"
}

export interface TechnologyDB {
  id: string;
  name: string;
  acronym?: string;
  url?: string;
  icon: string;
  icon_type: IconType
}

export interface ProjectDB {
  id: string;
  name: string;
  description: string;
  n_imgs: number;
  ProjectStack: {
    Technology: {
      id: string;
    }
  }[];
  ProjectLink: {
    name: string;
    url: string;
    icon: string;
    icon_type: IconType;
  }[];
  ProjectTag: {
    tag: string;
  }[];
}

interface ProjectTag {
  project_id: string;
  tag: string;
}

interface ProjectStack {
  project_id: string;
  tech_id: string;
}

interface ProjectLink {
  project_id: string;
  name: string;
  url: string;
  icon: string;
  icon_type: IconType;
}
