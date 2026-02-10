import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import LogDrawer from "~/components/LogDrawer";
import {
  selectedCardId,
  selectedCardTitle,
  selectedCardDescription,
  drawerKey,
  closeDrawer,
  sendFollowUp,
  handleRunComplete,
} from "~/stores/log-drawer-store";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <Suspense>{props.children}</Suspense>
          <LogDrawer
            cardId={selectedCardId()}
            cardTitle={selectedCardTitle()}
            cardDescription={selectedCardDescription()}
            reconnectKey={drawerKey()}
            onClose={closeDrawer}
            onSendFollowUp={sendFollowUp}
            onRunComplete={handleRunComplete}
          />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
