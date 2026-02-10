import {
  Component,
  createSignal,
  createEffect,
  on,
  onCleanup,
  batch,
  For,
  Show,
} from "solid-js";
import {
  getCardLogs,
  subscribeToCardLogs,
  sendCardInput,
  type CardLogEntry,
} from "~/api/card-logs";

interface LogDrawerProps {
  cardId: string | null;
  cardTitle?: string | null;
  cardDescription?: string | null;
  reconnectKey?: number;
  onClose: () => void;
  onSendFollowUp: (cardId: string, prompt: string) => void;
  onRunComplete?: () => void;
}

interface LogEntry {
  type: string;
  content: string;
  sequence: number;
}

const LOG_TYPE_STYLES: Record<string, { label: string; borderColor: string }> = {
  assistant_text: { label: "Assistant", borderColor: "#4a9eff" },
  tool_use: { label: "Tool Call", borderColor: "#a855f7" },
  tool_result: { label: "Tool Result", borderColor: "#22c55e" },
  error: { label: "Error", borderColor: "#ef4444" },
  user_input: { label: "User", borderColor: "#f97316" },
  system: { label: "System", borderColor: "#6b7280" },
  ask_user: { label: "Needs Input", borderColor: "#f97316" },
};

const LogDrawer: Component<LogDrawerProps> = (props) => {
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [status, setStatus] = createSignal<string>("not_found");
  const [needsInput, setNeedsInput] = createSignal(false);
  const [inputText, setInputText] = createSignal("");
  const [detailsOpen, setDetailsOpen] = createSignal(false);
  let eventSource: EventSource | null = null;
  let contentRef: HTMLDivElement | undefined;

  const scrollToBottom = () => {
    if (contentRef) {
      contentRef.scrollTop = contentRef.scrollHeight;
    }
  };

  const closeEventSource = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  let previousCardId: string | null = null;
  let hasSeenRunning = false;

  createEffect(
    on(
      () => [props.cardId, props.reconnectKey ?? 0] as const,
      ([cardId]) => {
        const cardChanged = cardId !== previousCardId;
        previousCardId = cardId;

        // Cleanup previous connection
        closeEventSource();
        hasSeenRunning = false;

        if (!cardId) {
          batch(() => {
            setLogs([]);
            setStatus("not_found");
            setNeedsInput(false);
          });
          return;
        }

        // Only clear logs when switching to a different card.
        // For reconnects on the same card (follow-ups), keep existing logs visible.
        if (cardChanged) {
          batch(() => {
            setLogs([]);
            setStatus("running");
            setNeedsInput(false);
          });
        } else {
          batch(() => {
            setStatus("running");
            setNeedsInput(false);
          });
        }

        // Load historical logs
        getCardLogs(cardId).then((historicalLogs) => {
          setLogs(
            historicalLogs.map((l) => ({
              type: l.type,
              content: l.content,
              sequence: l.sequence,
            }))
          );
          setTimeout(scrollToBottom, 50);
        }).catch(console.error);

        // Connect SSE
        eventSource = subscribeToCardLogs(cardId, {
          onLog(event) {
            setLogs((prev) => {
              // Deduplicate by sequence
              if (prev.some((l) => l.sequence === event.sequence)) return prev;
              return [...prev, { type: event.type, content: event.content, sequence: event.sequence }];
            });
            setTimeout(scrollToBottom, 50);
          },
          onStatus(event) {
            if (event.status === "running") {
              hasSeenRunning = true;
            }
            batch(() => {
              setStatus(event.status);
              if (event.needsInput !== undefined) {
                setNeedsInput(event.needsInput);
              }
            });
            // Only close when the run we're tracking actually finishes —
            // ignore stale "completed"/"error" from a previous run
            if ((event.status === "completed" || event.status === "error") && hasSeenRunning) {
              closeEventSource();
              props.onRunComplete?.();
            }
          },
          onNeedsInput(event) {
            setNeedsInput(event.needsInput);
          },
        });
      }
    )
  );

  onCleanup(() => {
    closeEventSource();
  });

  const isRunning = () => status() === "running";
  const isFinished = () => status() === "completed" || status() === "error" || status() === "not_found";

  const canSendInput = () => {
    return (isRunning() && needsInput()) || isFinished();
  };

  const handleSend = async () => {
    const cardId = props.cardId;
    const text = inputText().trim();
    if (!cardId || !text) return;

    if (isRunning() && needsInput()) {
      // Send input to running agent
      try {
        await sendCardInput(cardId, text);
        setInputText("");
      } catch (error) {
        console.error("Failed to send input:", error);
      }
    } else if (isFinished()) {
      // Send follow-up (starts new run)
      props.onSendFollowUp(cardId, text);
      setInputText("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusColor = () => {
    switch (status()) {
      case "running": return "#22c55e";
      case "completed": return "#4a9eff";
      case "not_found": return "#4a9eff";
      case "error": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = () => {
    const s = status();
    if (s === "not_found") return "idle";
    return s;
  };

  const formatContent = (type: string, content: string): string => {
    if (type === "tool_use") {
      try {
        const parsed = JSON.parse(content);
        return `Tool: ${parsed.tool}`;
      } catch {
        return content;
      }
    }
    if (type === "ask_user") {
      try {
        const parsed = JSON.parse(content);
        if (parsed.questions) {
          return parsed.questions.map((q: any) => q.question).join("\n");
        }
        return content;
      } catch {
        return content;
      }
    }
    if (content.length > 500) {
      return content.slice(0, 500) + "...";
    }
    return content;
  };

  const getInputPlaceholder = () => {
    if (isRunning() && needsInput()) return "Type your response to the agent...";
    if (isFinished()) return "Type a follow-up prompt...";
    return "Waiting for agent...";
  };

  return (
    <Show when={props.cardId}>
      <div class="log-drawer-backdrop" onClick={props.onClose} />
      <div class="log-drawer">
        <div class="log-drawer__header">
          <div class="log-drawer__header-left">
            <span
              class="log-drawer__status-dot"
              style={{ "background-color": getStatusColor() }}
            />
            <h3 class="log-drawer__title">Agent Logs</h3>
            <span class="log-drawer__status-text">{getStatusLabel()}</span>
          </div>
          <button class="log-drawer__close" onClick={props.onClose}>
            ×
          </button>
        </div>

        <Show when={props.cardTitle || props.cardDescription}>
          <div class="log-drawer__card-details">
            <button
              class="log-drawer__card-details-toggle"
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <svg
                class="log-drawer__card-details-chevron"
                classList={{ "log-drawer__card-details-chevron--open": detailsOpen() }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span class="log-drawer__card-details-label">Card Details</span>
            </button>
            <Show when={detailsOpen()}>
              <div class="log-drawer__card-details-body">
                <Show when={props.cardTitle}>
                  <div class="log-drawer__card-detail-title">{props.cardTitle}</div>
                </Show>
                <Show when={props.cardDescription}>
                  <div class="log-drawer__card-detail-description">{props.cardDescription}</div>
                </Show>
              </div>
            </Show>
          </div>
        </Show>

        <div class="log-drawer__content" ref={contentRef}>
          <Show
            when={logs().length > 0}
            fallback={
              <div class="log-drawer__empty">
                <p>No logs yet.</p>
                <Show when={isRunning()}>
                  <p>Waiting for agent output...</p>
                </Show>
              </div>
            }
          >
            <For each={logs()}>
              {(log) => {
                const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.system;
                return (
                  <div
                    class="log-entry"
                    classList={{
                      "log-entry--ask-user": log.type === "ask_user",
                    }}
                    style={{ "border-left-color": style.borderColor }}
                  >
                    <div class="log-entry__header">
                      <span
                        class="log-entry__type"
                        style={{ color: style.borderColor }}
                      >
                        {style.label}
                      </span>
                      <span class="log-entry__seq">#{log.sequence}</span>
                    </div>
                    <div class="log-entry__content">
                      {formatContent(log.type, log.content)}
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        <div class="log-drawer__footer">
          <Show when={isRunning() && !needsInput()}>
            <div class="log-drawer__running-indicator">
              <span class="log-drawer__spinner" />
              <span>Agent is working...</span>
            </div>
          </Show>
          <div class="log-drawer__input-row">
            <input
              type="text"
              class="log-drawer__input"
              placeholder={getInputPlaceholder()}
              value={inputText()}
              onInput={(e) => setInputText(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              disabled={!canSendInput()}
            />
            <button
              class="log-drawer__send"
              onClick={handleSend}
              disabled={!canSendInput() || !inputText().trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default LogDrawer;
