import { Title } from "@solidjs/meta";
import { createSignal, createResource, createEffect, onCleanup, Show } from "solid-js";
import { isServer } from "solid-js/web";

import KanbanBoard from "~/components/KanbanBoard";
import TopBar from "~/components/TopBar";
import CreateProjectModal from "~/components/CreateProjectModal";
import EditProjectModal from "~/components/EditProjectModal";
import { openDrawer, registerRefetch } from "~/stores/log-drawer-store";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getAutoModeStatus,
  toggleAutoMode,
  setAutoModeConcurrency,
  type Project,
  type AutoModeStatus,
} from "~/api";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);
  const [projectToEdit, setProjectToEdit] = createSignal<Project | null>(null);
  const [refreshKey, setRefreshKey] = createSignal(0);
  const [autoModeStatus, setAutoModeStatus] = createSignal<AutoModeStatus | null>(null);

  const [projects, { refetch }] = createResource(
    () => (isServer ? null : refreshKey()),
    getProjects,
    { initialValue: [] }
  );

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem("selectedProjectId", projectId);
  };

  const handleNewProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateProject = async (name: string, filePath: string) => {
    try {
      const newProject = await createProject(name, filePath);
      setIsCreateModalOpen(false);
      setRefreshKey((k) => k + 1);
      setSelectedProjectId(newProject.id);
      localStorage.setItem("selectedProjectId", newProject.id);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    try {
      await deleteProject(projectId);
      
      // If the deleted project was selected, clear selection
      if (selectedProjectId() === projectId) {
        setSelectedProjectId(null);
        localStorage.removeItem("selectedProjectId");
      }

      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to delete project:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete project. Please try again.";
      alert(errorMessage);
      throw error;
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
  };

  const handleUpdateProject = async (name: string, filePath: string) => {
    const project = projectToEdit();
    if (!project) return;

    try {
      await updateProject(project.id, name, filePath);
      setProjectToEdit(null);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  // Auto mode polling
  let autoModePollInterval: ReturnType<typeof setInterval> | undefined;

  const fetchAutoModeStatus = async () => {
    const projectId = selectedProjectId();
    if (!projectId) return;
    try {
      const status = await getAutoModeStatus(projectId);
      setAutoModeStatus(status);
    } catch {
      // Ignore polling errors
    }
  };

  createEffect(() => {
    const projectId = selectedProjectId();

    // Clear previous interval
    if (autoModePollInterval) {
      clearInterval(autoModePollInterval);
      autoModePollInterval = undefined;
    }

    if (projectId) {
      // Fetch immediately
      fetchAutoModeStatus();
      // Poll every 2 seconds
      autoModePollInterval = setInterval(fetchAutoModeStatus, 2000);
    } else {
      setAutoModeStatus(null);
    }
  });

  onCleanup(() => {
    if (autoModePollInterval) {
      clearInterval(autoModePollInterval);
    }
  });

  const handleToggleAutoMode = async (enabled: boolean) => {
    const projectId = selectedProjectId();
    if (!projectId) return;
    try {
      await toggleAutoMode(projectId, enabled);
      await fetchAutoModeStatus();
    } catch (error) {
      console.error("Failed to toggle auto mode:", error);
    }
  };

  const handleSetConcurrency = async (value: number) => {
    const projectId = selectedProjectId();
    if (!projectId) return;
    try {
      await setAutoModeConcurrency(projectId, value);
      await fetchAutoModeStatus();
    } catch (error) {
      console.error("Failed to set concurrency:", error);
    }
  };


  // Restore last selected project or auto-select first project
  createEffect(() => {
    const projs = projects();
    if (projs && projs.length > 0 && !selectedProjectId()) {
      const savedId = localStorage.getItem("selectedProjectId");
      const savedExists = savedId && projs.some((p) => p.id === savedId);
      const projectId = savedExists ? savedId : projs[0].id;
      setSelectedProjectId(projectId);
      localStorage.setItem("selectedProjectId", projectId);
    }
  });

  const hasProjects = () => {
    const projs = projects();
    return projs && projs.length > 0;
  };

  return (
    <main>
      <Title>Dashboard - Kanban Board</Title>
      <Show
        when={hasProjects()}
        fallback={
          <div class="empty-state">
            <div class="empty-state__content">
              <h2 class="empty-state__title">No Projects Yet</h2>
              <p class="empty-state__description">
                Get started by opening a directory to create your first project.
                You'll be able to organize your tasks with a Kanban board.
              </p>
              <button
                class="empty-state__button"
                onClick={handleNewProject}
              >
                Open Directory
              </button>
            </div>
          </div>
        }
      >
        <TopBar
          projects={projects() || []}
          selectedProjectId={selectedProjectId()}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          autoModeEnabled={autoModeStatus()?.enabled ?? false}
          autoModeConcurrency={autoModeStatus()?.maxConcurrency ?? 1}
          autoModeActiveRuns={autoModeStatus()?.activeRunCount ?? 0}
          onToggleAutoMode={handleToggleAutoMode}
          onSetConcurrency={handleSetConcurrency}
        />
        <KanbanBoard
          projectId={selectedProjectId()}
          autoModeActive={(autoModeStatus()?.loopRunning || (autoModeStatus()?.activeRunCount ?? 0) > 0) ?? false}
          onCardClick={openDrawer}
          onRefetchReady={registerRefetch}
        />
      </Show>
      <CreateProjectModal
        isOpen={isCreateModalOpen()}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      <EditProjectModal
        isOpen={projectToEdit() !== null}
        onClose={() => setProjectToEdit(null)}
        onSubmit={handleUpdateProject}
        project={projectToEdit()}
      />
    </main>
  );
}
