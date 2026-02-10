import { useDroppable } from "@dnd-kit/core";
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

export default function KanbanColumn(props: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: props.column.id });
  const isEmpty = props.cards.length === 0;
  const isTodoColumn = props.column.id === "todo";

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "kanban-column--active" : ""}`}
    >
      <div className="kanban-column__header">
        <div className="kanban-column__header-left">
          <h2 className="kanban-column__title">{props.column.title}</h2>
          <span className="kanban-column__count">{props.cards.length}</span>
        </div>
        {props.onViewArchived && (
          <button
            className="kanban-column__view-archived"
            onClick={props.onViewArchived}
            type="button"
            aria-label="View archived cards"
            title="View archived cards"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        )}
        {props.onCreateCard && (
          <button
            className="kanban-column__add-btn"
            onClick={props.onCreateCard}
            type="button"
            aria-label="Add item"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
      <div className="kanban-column__content">
        {!isEmpty ? (
          props.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={props.onDeleteCard}
              onArchive={props.onArchiveCard}
              onClick={props.onCardClick ? () => props.onCardClick?.(card.id) : undefined}
            />
          ))
        ) : isTodoColumn && props.onCreateCard ? (
          <div className="kanban-column__empty kanban-column__empty--actionable">
            <div className="kanban-column__empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p className="kanban-column__empty-text">No items yet</p>
            <button className="kanban-column__create-button" onClick={props.onCreateCard} type="button">
              Create New Item
            </button>
          </div>
        ) : (
          <div className="kanban-column__empty">
            <div className="kanban-column__empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="kanban-column__empty-text">No items yet</p>
          </div>
        )}
      </div>
      {props.onCreateCard && (
        <button className="kanban-column__add-bottom" onClick={props.onCreateCard} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add item
        </button>
      )}
    </div>
  );
}
