import { autoModeSettingsRepository } from "~/db/repositories";
import { cardRepository } from "~/db/repositories";
import { projectRepository } from "~/db/repositories";
import { cardRunStateService } from "./card-run-state";
import { StartCardRunUseCase } from "~/use-cases/start-card-run";

interface LoopState {
  intervalId: ReturnType<typeof setInterval>;
  activeCardIds: Set<string>;
  isProcessing: boolean;
}

class AutoModeService {
  private loops = new Map<string, LoopState>();
  private initialized = false;

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const enabledSettings = await autoModeSettingsRepository.getAllEnabled();
      for (const settings of enabledSettings) {
        this.startLoop(settings.projectId);
      }
      if (enabledSettings.length > 0) {
        console.log(`[AutoMode] Restored ${enabledSettings.length} auto mode loop(s) from DB`);
      }
    } catch (error) {
      console.error("[AutoMode] Failed to restore loops from DB:", error);
    }
  }

  startLoop(projectId: string): void {
    if (this.loops.has(projectId)) return;

    const state: LoopState = {
      intervalId: setInterval(() => this.poll(projectId), 3000),
      activeCardIds: new Set(),
      isProcessing: false,
    };

    this.loops.set(projectId, state);
    console.log(`[AutoMode] Started loop for project ${projectId}`);
  }

  stopLoop(projectId: string): void {
    const state = this.loops.get(projectId);
    if (!state) return;

    clearInterval(state.intervalId);
    this.loops.delete(projectId);
    console.log(`[AutoMode] Stopped loop for project ${projectId}`);
  }

  isLoopRunning(projectId: string): boolean {
    return this.loops.has(projectId);
  }

  getActiveRunCount(projectId: string): number {
    const state = this.loops.get(projectId);
    if (!state) return 0;
    return state.activeCardIds.size;
  }

  getStatus(projectId: string): {
    loopRunning: boolean;
    activeRunCount: number;
    activeCardIds: string[];
  } {
    const state = this.loops.get(projectId);
    return {
      loopRunning: this.loops.has(projectId),
      activeRunCount: state ? state.activeCardIds.size : 0,
      activeCardIds: state ? Array.from(state.activeCardIds) : [],
    };
  }

  private async poll(projectId: string): Promise<void> {
    const state = this.loops.get(projectId);
    if (!state || state.isProcessing) return;

    state.isProcessing = true;
    try {
      // Check if auto mode is still enabled in DB
      const settings = await autoModeSettingsRepository.getByProjectId(projectId);
      if (!settings || !settings.enabled) {
        this.stopLoop(projectId);
        return;
      }

      // Check active cards - clean up completed/errored ones
      for (const cardId of state.activeCardIds) {
        const run = cardRunStateService.getRun(cardId);
        if (!run || run.status === "completed") {
          // Card completed - move to "done"
          try {
            await cardRepository.updateCard(cardId, {
              columnId: "done",
              updatedAt: new Date(),
            });
            console.log(`[AutoMode] Card ${cardId} completed, moved to done`);
          } catch {
            // Card may already have been moved
          }
          state.activeCardIds.delete(cardId);
        } else if (run.status === "error") {
          // Card errored - move to "manual-review"
          try {
            await cardRepository.updateCard(cardId, {
              columnId: "manual-review",
              updatedAt: new Date(),
            });
            console.log(`[AutoMode] Card ${cardId} errored, moved to manual-review`);
          } catch {
            // Card may already have been moved
          }
          state.activeCardIds.delete(cardId);
        }
      }

      // Calculate available slots
      const availableSlots = settings.maxConcurrency - state.activeCardIds.size;
      if (availableSlots <= 0) return;

      // Fetch todo cards for the project
      const allCards = await cardRepository.getCardsByProjectId(projectId);
      const todoCards = allCards.filter((card) => card.columnId === "todo");

      // Take up to availableSlots cards
      const cardsToRun = todoCards.slice(0, availableSlots);

      for (const card of cardsToRun) {
        // Skip if already running
        if (cardRunStateService.isRunning(card.id)) {
          state.activeCardIds.add(card.id);
          continue;
        }

        try {
          // Move to in-progress
          await cardRepository.updateCard(card.id, {
            columnId: "in-progress",
            updatedAt: new Date(),
          });

          // Start the run
          const useCase = new StartCardRunUseCase(cardRepository, projectRepository);
          await useCase.execute({ cardId: card.id });

          state.activeCardIds.add(card.id);
          console.log(`[AutoMode] Started card ${card.id} for project ${projectId}`);
        } catch (error) {
          console.error(`[AutoMode] Failed to start card ${card.id}:`, error);
          // Move back to todo on failure to start
          try {
            await cardRepository.updateCard(card.id, {
              columnId: "todo",
              updatedAt: new Date(),
            });
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    } catch (error) {
      console.error(`[AutoMode] Poll error for project ${projectId}:`, error);
    } finally {
      state.isProcessing = false;
    }
  }
}

export const autoModeService = new AutoModeService();
