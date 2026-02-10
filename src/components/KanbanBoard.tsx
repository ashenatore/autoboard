import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
} from "@thisbeyond/solid-dnd";
import { Component, createSignal, createResource, createEffect, For, Show, onCleanup } from "solid-js";
import KanbanColumn from "./KanbanColumn";
import { CardContent } from "./KanbanCard";
import type { Card } from "~/api/cards";
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
  archiveCard,
  getArchivedCards,
} from "~/api/cards";
import { generateTitle } from "~/api/generate-title";
import { runCard } from "~/api/run-card";
import { getNeedsInput, getRunningCards } from "~/api/card-logs";
import CreateCardModal from "./CreateCardModal";
import ArchivedCardsModal from "./ArchivedCardsModal";
import FloatingActionButton from "./FloatingActionButton";

interface Column {
  id: string;
  title: string;
  description?: string;
}

interface KanbanBoardProps {
  projectId: string | null;
  autoModeActive?: boolean;
  onCardClick?: (cardId: string, title?: string, description?: string) => void;
  onRefetchReady?: (refetch: () => void) => void;
}


const KanbanBoard: Component<KanbanBoardProps> = (props) => {
  const columns: Column[] = [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "manual-review", title: "Manual Review" },
    { id: "done", title: "Done" },
  ];

  const [refreshKey, setRefreshKey] = createSignal(0);
  const [needsInputMap, setNeedsInputMap] = createSignal<Record<string, boolean>>({});
  const [runningCardsMap, setRunningCardsMap] = createSignal<Record<string, boolean>>({});

  // Access projectId reactively - props.projectId is reactive when accessed
  const currentProjectId = () => props.projectId;

  const [cards, { refetch }] = createResource(
    () => {
      // Only fetch on client side and when projectId is available
      // Access props.projectId directly to ensure reactivity
      const pid = props.projectId;
      if (!pid) {
        return null;
      }
      return [refreshKey(), pid] as const;
    },
    ([, projectId]) => getCards(projectId),
    { initialValue: [] }
  );

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = createSignal(false);
  const [generatingTitles, setGeneratingTitles] = createSignal<Set<string>>(
    new Set()
  );

  const [archivedCards, { refetch: refetchArchived }] = createResource(
    () => {
      const pid = props.projectId;
      if (!isArchivedModalOpen() || !pid) {
        return null;
      }
      return pid;
    },
    (projectId) => getArchivedCards(projectId),
    { initialValue: [] }
  );

  // Poll for needsInput and running cards every 3 seconds
  const pollInterval = setInterval(async () => {
    try {
      const [needsInputResult, runningResult] = await Promise.all([
        getNeedsInput(),
        getRunningCards(),
      ]);
      setNeedsInputMap(needsInputResult);

      // Detect cards that stopped running (completed) and refetch to update columns
      const oldRunning = runningCardsMap();
      const hadRunning = Object.keys(oldRunning).some((id) => oldRunning[id]);
      const stillRunning = Object.keys(runningResult).some((id) => runningResult[id]);
      if (hadRunning && !stillRunning) {
        refetch();
      } else if (hadRunning) {
        // Check if any specific card stopped running
        const stoppedRunning = Object.keys(oldRunning).some(
          (id) => oldRunning[id] && !runningResult[id]
        );
        if (stoppedRunning) {
          refetch();
        }
      }

      setRunningCardsMap(runningResult);
    } catch {
      // Ignore polling errors
    }
  }, 3000);
  onCleanup(() => clearInterval(pollInterval));

  // Poll cards when auto mode is active (using refetch to avoid triggering Suspense)
  createEffect(() => {
    if (!props.autoModeActive) return;
    const interval = setInterval(() => refetch(), 2000);
    onCleanup(() => clearInterval(interval));
  });

  const getCardsForColumn = (columnId: string) => {
    const allCards = cards() || [];
    const generatingSet = generatingTitles();
    const inputMap = needsInputMap();
    const runningMap = runningCardsMap();
    return allCards
      .filter((card) => card.columnId === columnId)
      .map((card) => ({
        ...card,
        generatingTitle: generatingSet.has(card.id),
        needsInput: inputMap[card.id] || false,
        isRunning: runningMap[card.id] || false,
      }));
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      // Refresh the cards list after successful deletion
      refetch();
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card. Please try again.");
    }
  };

  const handleArchiveCard = async (cardId: string) => {
    try {
      await archiveCard(cardId);
      refetch();
    } catch (error) {
      console.error("Error archiving card:", error);
      alert("Failed to archive card. Please try again.");
    }
  };

  const handleViewArchived = () => {
    setIsArchivedModalOpen(true);
  };

  const handleCardClick = (cardId: string) => {
    const card = cards()?.find((c) => c.id === cardId);
    const title = card?.title ?? undefined;
    const description = card?.description ?? undefined;
    props.onCardClick?.(cardId, title, description);
  };

  // Expose refetch to parent
  createEffect(() => {
    if (props.onRefetchReady) {
      props.onRefetchReady(() => refetch());
    }
  });

  const handleDragEnd = async ({ draggable, droppable }: any) => {
    if (!droppable) return;

    const cardId = draggable.id as string;
    const newColumnId = droppable.id as string;

    // Update in database
    try {
      await updateCard(cardId, { columnId: newColumnId });
      // Refresh to ensure consistency
      refetch();

      // If moved to in-progress, start the agent run
      if (newColumnId === "in-progress") {
        try {
          await runCard({ cardId });
        } catch (error) {
          console.error("Error starting card run:", error);
        }
      }
    } catch (error) {
      console.error("Error updating card:", error);
      // Revert optimistic update on error
      refetch();
    }
  };

  const handleCreateCard = async (
    title: string,
    description: string,
    columnId: string
  ) => {
    const pid = currentProjectId();
    if (!pid) {
      alert("Please select a project first.");
      return;
    }

    try {
      const newCard = await createCard({
        title: title || undefined,
        description,
        columnId,
        projectId: pid,
      });
      setIsModalOpen(false);
      refetch();

      // If card was created without a title, generate one
      if ((!title || title.trim() === "") && description && !newCard.title) {
        setGeneratingTitles((prev) => new Set(prev).add(newCard.id));

        try {
          await generateTitle(newCard.id);
          // Refresh cards to get the updated title
          refetch();
        } catch (error) {
          console.error("Error generating title:", error);
          // Don't show alert - title generation failure shouldn't block the user
        } finally {
          setGeneratingTitles((prev) => {
            const next = new Set(prev);
            next.delete(newCard.id);
            return next;
          });
        }
      }
    } catch (error) {
      console.error("Error creating card:", error);
      alert("Failed to create card. Please try again.");
    }
  };

  return (
    <>
      <Show
        when={props.projectId}
        fallback={
          <div class="kanban-board">
            <div class="kanban-board__fallback">
              <p>Please select a project to view its Kanban board.</p>
            </div>
          </div>
        }
      >
        <DragDropProvider onDragEnd={handleDragEnd}>
          <DragDropSensors />
          <div class="kanban-board">
            <div class="kanban-board__columns">
              <For each={columns}>
                {(column) => (
                  <KanbanColumn
                    column={column}
                    cards={getCardsForColumn(column.id)}
                    onDeleteCard={handleDeleteCard}
                    onCreateCard={
                      column.id === "todo"
                        ? () => {
                            setIsModalOpen(true);
                          }
                        : undefined
                    }
                    onArchiveCard={
                      column.id === "done" ? handleArchiveCard : undefined
                    }
                    onViewArchived={
                      column.id === "done" ? handleViewArchived : undefined
                    }
                    onCardClick={handleCardClick}
                  />
                )}
              </For>
            </div>
          </div>
          <DragOverlay>
            {(draggable) => {
              if (!draggable) return null;
              const currentCard = cards()?.find((c) => c.id === draggable.id);
              if (!currentCard) return null;
              const generatingSet = generatingTitles();
              const inputMap = needsInputMap();
              const runningMap = runningCardsMap();
              return (
                <div class="kanban-card">
                  <CardContent
                    card={{
                      ...currentCard,
                      generatingTitle: generatingSet.has(currentCard.id),
                      needsInput: inputMap[currentCard.id] || false,
                      isRunning: runningMap[currentCard.id] || false,
                    }}
                  />
                </div>
              );
            }}
          </DragOverlay>
        </DragDropProvider>
        <FloatingActionButton onClick={() => setIsModalOpen(true)} />
        <CreateCardModal
          isOpen={isModalOpen()}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateCard}
        />
        <ArchivedCardsModal
          isOpen={isArchivedModalOpen()}
          onClose={() => setIsArchivedModalOpen(false)}
          archivedCards={archivedCards() || []}
        />
      </Show>
    </>
  );
};

export default KanbanBoard;
