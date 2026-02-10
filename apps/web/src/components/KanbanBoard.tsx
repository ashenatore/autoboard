import { useState, useEffect, useCallback } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import CreateCardModal from "./CreateCardModal";
import ArchivedCardsModal from "./ArchivedCardsModal";
import FloatingActionButton from "./FloatingActionButton";
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
  archiveCard,
  getArchivedCards,
  generateTitle,
  runCard,
  getNeedsInput,
  getRunningCards,
} from "~/api";
import type { Card } from "~/api/cards";

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "manual-review", title: "Manual Review" },
  { id: "done", title: "Done" },
];

interface KanbanBoardProps {
  projectId: string | null;
  autoModeActive?: boolean;
  onCardClick?: (cardId: string, title?: string, description?: string) => void;
}

export default function KanbanBoard(props: KanbanBoardProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [needsInputMap, setNeedsInputMap] = useState<Record<string, boolean>>({});
  const [runningCardsMap, setRunningCardsMap] = useState<Record<string, boolean>>({});
  const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadCards = useCallback(async () => {
    if (!props.projectId) return;
    try {
      const data = await getCards(props.projectId);
      setCards(data);
    } catch (e) {
      console.error(e);
    }
  }, [props.projectId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (isArchivedModalOpen && props.projectId) {
      getArchivedCards(props.projectId).then(setArchivedCards).catch(console.error);
    }
  }, [isArchivedModalOpen, props.projectId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [needs, running] = await Promise.all([
          getNeedsInput(),
          getRunningCards(),
        ]);
        setNeedsInputMap(needs);
        setRunningCardsMap((old) => {
          const hadRunning = Object.values(old).some(Boolean);
          const stillRunning = Object.values(running).some(Boolean);
          if (hadRunning && !stillRunning) loadCards();
          return running;
        });
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [loadCards]);

  useEffect(() => {
    if (!props.autoModeActive) return;
    const interval = setInterval(loadCards, 2000);
    return () => clearInterval(interval);
  }, [props.autoModeActive, loadCards]);

  const getCardsForColumn = (columnId: string) =>
    cards
      .filter((c) => c.columnId === columnId)
      .map((c) => ({
        ...c,
        generatingTitle: generatingTitles.has(c.id),
        needsInput: needsInputMap[c.id] ?? false,
        isRunning: runningCardsMap[c.id] ?? false,
      }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const cardId = active.id as string;
    const newColumnId = over.id as string;
    try {
      await updateCard(cardId, { columnId: newColumnId });
      loadCards();
      if (newColumnId === "in-progress") {
        try {
          await runCard({ cardId });
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
      loadCards();
    }
  };

  const handleCreateCard = async (
    title: string,
    description: string,
    columnId: string
  ) => {
    if (!props.projectId) {
      alert("Please select a project first.");
      return;
    }
    try {
      const newCard = await createCard({
        title: title || undefined,
        description,
        columnId,
        projectId: props.projectId,
      });
      setIsModalOpen(false);
      loadCards();
      if ((!title || !title.trim()) && description && !newCard.title) {
        setGeneratingTitles((prev) => new Set(prev).add(newCard.id));
        try {
          await generateTitle(newCard.id);
          loadCards();
        } catch (e) {
          console.error(e);
        } finally {
          setGeneratingTitles((prev) => {
            const next = new Set(prev);
            next.delete(newCard.id);
            return next;
          });
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to create card.");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      loadCards();
    } catch (e) {
      console.error(e);
      alert("Failed to delete card.");
    }
  };

  const handleArchiveCard = async (cardId: string) => {
    try {
      await archiveCard(cardId);
      loadCards();
    } catch (e) {
      console.error(e);
      alert("Failed to archive card.");
    }
  };

  const handleCardClick = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    props.onCardClick?.(cardId, card?.title ?? undefined, card?.description ?? undefined);
  };

  if (!props.projectId) {
    return (
      <div className="kanban-board">
        <div className="kanban-board__fallback">
          <p>Please select a project to view its Kanban board.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <div className="kanban-board__columns">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={getCardsForColumn(column.id)}
                onDeleteCard={handleDeleteCard}
                onCreateCard={column.id === "todo" ? () => setIsModalOpen(true) : undefined}
                onArchiveCard={handleArchiveCard}
                onViewArchived={column.id === "todo" || column.id === "done" ? () => setIsArchivedModalOpen(true) : undefined}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>
      </DndContext>
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />
      <CreateCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCard}
      />
      <ArchivedCardsModal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        archivedCards={archivedCards}
      />
    </>
  );
}
