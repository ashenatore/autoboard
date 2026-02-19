import { useState, useEffect } from "react";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, columnId: string) => void;
}

export default function CreateCardModal(props: CreateCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (props.isOpen) {
      setTitle("");
      setDescription("");
    }
  }, [props.isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      props.onSubmit(title.trim() || "", description.trim(), "todo");
      setTitle("");
      setDescription("");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!props.isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation" data-testid="create-card-modal">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Feature</h2>
          <button className="modal-close" onClick={props.onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label htmlFor="card-title" className="modal-label">
              Title
            </label>
            <input
              id="card-title"
              type="text"
              className="modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter feature title (optional - will be auto-generated if empty)"
              autoFocus
              data-testid="card-title-input"
            />
          </div>
          <div className="modal-field">
            <label htmlFor="card-description" className="modal-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="card-description"
              className="modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter feature description"
              rows={4}
              required
              data-testid="card-description-input"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-button modal-button--secondary"
              onClick={props.onClose}
              data-testid="create-card-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button--primary"
              disabled={!description.trim()}
              data-testid="create-card-submit"
            >
              Create Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
