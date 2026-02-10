import { Component, createSignal, createEffect, onMount, onCleanup } from "solid-js";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, filePath: string) => void;
  project: { name: string; filePath: string } | null;
}

const EditProjectModal: Component<EditProjectModalProps> = (props) => {
  const [name, setName] = createSignal("");
  const [filePath, setFilePath] = createSignal("");

  const extractDirectoryName = (path: string): string => {
    const parts = path.split(/[/\\]/).filter(part => part.length > 0);
    return parts.length > 0 ? parts[parts.length - 1] : path;
  };

  createEffect(() => {
    if (props.isOpen && props.project) {
      setName(props.project.name);
      setFilePath(props.project.filePath);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (filePath().trim()) {
      const projectName = name().trim() || extractDirectoryName(filePath().trim());
      props.onSubmit(projectName, filePath().trim());
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  onMount(() => {
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", handleEscape);
    }
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", handleEscape);
    }
  });

  return (
    <>
      {props.isOpen && (
        <div
          class="modal-backdrop"
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div class="modal-container" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">Edit Project</h2>
              <button
                class="modal-close"
                onClick={props.onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form class="modal-form" onSubmit={handleSubmit}>
              <div class="modal-field">
                <label for="edit-project-path" class="modal-label">
                  Project Folder Path <span class="required">*</span>
                </label>
                <input
                  id="edit-project-path"
                  type="text"
                  class="modal-input"
                  value={filePath()}
                  onInput={(e) => {
                    const path = e.currentTarget.value;
                    setFilePath(path);
                    if (!name().trim() && path.trim()) {
                      const dirName = extractDirectoryName(path.trim());
                      setName(dirName);
                    }
                  }}
                  placeholder="/Users/you/projects/my-app"
                  required
                  autofocus
                />
              </div>
              <div class="modal-field">
                <label for="edit-project-name" class="modal-label">
                  Project Name
                </label>
                <input
                  id="edit-project-name"
                  type="text"
                  class="modal-input"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter project name (optional)"
                />
              </div>
              <div class="modal-actions">
                <button
                  type="button"
                  class="modal-button modal-button--secondary"
                  onClick={props.onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="modal-button modal-button--primary"
                  disabled={!filePath().trim()}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProjectModal;
