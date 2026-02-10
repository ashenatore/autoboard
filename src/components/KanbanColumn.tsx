import { createDroppable } from "@thisbeyond/solid-dnd";
import { Component, For, Show } from "solid-js";
import KanbanCard from "./KanbanCard";
import type { Card } from "~/api/cards";

interface Column {
  id: string;
  title: string;
}

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  onDeleteCard: (cardId: string) => void;
  onCreateCard?: () => void;
  onArchiveCard?: (cardId: string) => void;
  onViewArchived?: () => void;
  onCardClick?: (cardId: string) => void;
}

const KanbanColumn: Component<KanbanColumnProps> = (props) => {
  const droppable = createDroppable(props.column.id);
  const isEmpty = () => props.cards.length === 0;
  const isTodoColumn = () => props.column.id === "todo";

  return (
    <div
      use:droppable
      class="kanban-column"
      classList={{
        "kanban-column--active": droppable.isActiveDroppable,
      }}
    >
      <div class="kanban-column__header">
        <div class="kanban-column__header-left">
          <h2 class="kanban-column__title">{props.column.title}</h2>
          <span class="kanban-column__count">{props.cards.length}</span>
        </div>
        <Show when={props.onViewArchived}>
          <button
            class="kanban-column__view-archived"
            onClick={props.onViewArchived}
            type="button"
            aria-label="View archived cards"
            title="View archived cards"
          >
            <svg
              width="16"
              height="16"
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
        <Show when={props.onCreateCard}>
          <button
            class="kanban-column__add-btn"
            onClick={props.onCreateCard}
            type="button"
            aria-label="Add item"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </Show>
      </div>
      <div class="kanban-column__content">
        <Show
          when={!isEmpty()}
          fallback={
            <Show
              when={isTodoColumn() && props.onCreateCard}
              fallback={
                <div class="kanban-column__empty">
                  <div class="kanban-column__empty-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="9" x2="15" y2="9" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <p class="kanban-column__empty-text">No items yet</p>
                </div>
              }
            >
              <div class="kanban-column__empty kanban-column__empty--actionable">
                <div class="kanban-column__empty-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p class="kanban-column__empty-text">No items yet</p>
                <button
                  class="kanban-column__create-button"
                  onClick={props.onCreateCard}
                  type="button"
                >
                  Create New Item
                </button>
              </div>
            </Show>
          }
        >
          <For each={props.cards}>
            {(card) => (
              <KanbanCard
                card={card}
                onDelete={props.onDeleteCard}
                onArchive={props.onArchiveCard}
                onClick={props.onCardClick ? () => props.onCardClick!(card.id) : undefined}
              />
            )}
          </For>
        </Show>
      </div>
      <Show when={props.onCreateCard}>
        <button
          class="kanban-column__add-bottom"
          onClick={props.onCreateCard}
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add item
        </button>
      </Show>
    </div>
  );
};

export default KanbanColumn;
