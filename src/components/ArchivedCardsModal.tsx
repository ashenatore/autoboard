import { Component, For, Show, onMount, onCleanup } from "solid-js";
import type { Card } from "~/api/cards";

interface ArchivedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedCards: Card[];
}

const ArchivedCardsModal: Component<ArchivedCardsModalProps> = (props) => {
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              <h2 class="modal-title">Archived Cards</h2>
              <button
                class="modal-close"
                onClick={props.onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div class="archived-modal__content">
              <Show
                when={props.archivedCards.length > 0}
                fallback={
                  <div class="archived-modal__empty">
                    <p>No archived cards yet.</p>
                  </div>
                }
              >
                <div class="archived-modal__list">
                  <For each={props.archivedCards}>
                    {(card) => (
                      <div class="archived-card">
                        <div class="archived-card__title">
                          {card.title || "Untitled"}
                        </div>
                        {card.description && (
                          <div class="archived-card__description">
                            {card.description}
                          </div>
                        )}
                        <div class="archived-card__date">
                          Archived {formatDate(card.archivedAt)}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArchivedCardsModal;
