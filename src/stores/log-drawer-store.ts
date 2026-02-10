import { createSignal } from "solid-js";
import { updateCard } from "~/api/cards";
import { runCard } from "~/api/run-card";

const [selectedCardId, setSelectedCardId] = createSignal<string | null>(null);
const [selectedCardTitle, setSelectedCardTitle] = createSignal<
  string | undefined
>();
const [selectedCardDescription, setSelectedCardDescription] = createSignal<
  string | undefined
>();
const [drawerKey, setDrawerKey] = createSignal(0);

let refetchCards: (() => void) | undefined;

export function registerRefetch(fn: () => void) {
  refetchCards = fn;
}

export function openDrawer(
  cardId: string,
  title?: string,
  description?: string
) {
  setSelectedCardId(cardId);
  setSelectedCardTitle(title);
  setSelectedCardDescription(description);
}

export function closeDrawer() {
  setSelectedCardId(null);
}

export async function sendFollowUp(cardId: string, prompt: string) {
  try {
    await updateCard(cardId, { columnId: "in-progress" });
    await runCard({ cardId, prompt });
    setDrawerKey((k) => k + 1);
    refetchCards?.();
  } catch (error) {
    console.error("Error sending follow-up:", error);
    alert("Failed to send follow-up. Please try again.");
  }
}

export function handleRunComplete() {
  refetchCards?.();
}

export {
  selectedCardId,
  selectedCardTitle,
  selectedCardDescription,
  drawerKey,
};
