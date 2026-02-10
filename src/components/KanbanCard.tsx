import { createDraggable } from "@thisbeyond/solid-dnd";
import { Component, Show } from "solid-js";
import type { Card } from "~/api/cards";

interface KanbanCardProps {
  card: Card;
  onDelete: (cardId: string) => void;
  onArchive?: (cardId: string) => void;
  onClick?: () => void;
}

export const CardContent: Component<{ card: Card }> = (props) => {
  return (
    <>
      <div class="kanban-card__title">
        {props.card.generatingTitle ? (
          <div class="kanban-card__title-generating">
            <span class="kanban-card__spinner"></span>
            <span>Generating title...</span>
          </div>
        ) : props.card.title ? (
          props.card.title
        ) : (
          <span class="kanban-card__title-placeholder">Untitled</span>
        )}
      </div>
      {props.card.description && (
        <div class="kanban-card__description">{props.card.description}</div>
      )}
      <Show when={props.card.isRunning}>
        <div class="kanban-card__progress-bar" title="Card is running">
          <div class="kanban-card__progress-bar-inner"></div>
        </div>
      </Show>
      <Show when={props.card.needsInput}>
        <span class="kanban-card__needs-input-badge" title="Agent needs your input">!</span>
      </Show>
    </>
  );
};

const KanbanCard: Component<KanbanCardProps> = (props) => {
  const draggable = createDraggable(props.card.id);

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    props.onDelete(props.card.id);
  };

  const handleArchive = (e: MouseEvent) => {
    e.stopPropagation();
    props.onArchive?.(props.card.id);
  };

  const handleClick = (e: MouseEvent) => {
    // Don't trigger click when clicking action buttons
    const target = e.target as HTMLElement;
    if (target.closest(".kanban-card__actions")) return;
    props.onClick?.();
  };

  return (
    <div
      use:draggable={() => ({ skipTransform: true })}
      class="kanban-card"
      classList={{
        "kanban-card--dragging": draggable.isActiveDraggable,
        "kanban-card--clickable": !!props.onClick,
      }}
      onClick={handleClick}
    >
      <CardContent card={props.card} />
      <div class="kanban-card__actions">
        <Show when={props.onArchive}>
          <button
            class="kanban-card__archive"
            onClick={handleArchive}
            aria-label="Archive card"
            title="Archive card"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        </Show>
        <button
          class="kanban-card__delete"
          onClick={handleDelete}
          aria-label="Delete card"
          title="Delete card"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default KanbanCard;
