export const ACTIVE_PROJECT_CHANGE_EVENT =
  "projectpulse:active-project-change";
export const PROJECTS_LOADED_EVENT = "projectpulse:projects-loaded";

export function getActiveProjectId() {
  return localStorage.getItem("activeProjectId") || "";
}

export function emitActiveProjectChange(projectId, project = null) {
  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROJECT_CHANGE_EVENT, {
      detail: { projectId: projectId || "", project },
    })
  );
}

export function emitProjectsLoaded(projects) {
  window.dispatchEvent(
    new CustomEvent(PROJECTS_LOADED_EVENT, {
      detail: { projects },
    })
  );
}

export function selectActiveProject(project) {
  const projectId = project?.id || "";

  if (projectId) {
    localStorage.setItem("activeProjectId", projectId);
  } else {
    localStorage.removeItem("activeProjectId");
  }

  emitActiveProjectChange(projectId, project);
}

export function upsertProject(projects, project) {
  if (!project) return projects;

  const exists = projects.some((item) => item.id === project.id);

  return exists
    ? projects.map((item) => (item.id === project.id ? project : item))
    : [...projects, project];
}

export function syncActiveProject(event, setProjects, setProjectId) {
  const { projectId, project } = event.detail || {};

  if (project) {
    setProjects((current) => upsertProject(current, project));
  }

  setProjectId(projectId || "");
}
