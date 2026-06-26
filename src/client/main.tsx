import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/client/app";
import { readPersistedDashboardSnapshotSync } from "@/client/dashboard-snapshot";
import { restoreDashboardFromCache } from "@/client/use-live-socket";
import { MotionProvider } from "@/components/motion-provider";

if (import.meta.env.DEV) {
  void import("react-grab");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

const cachedSnapshot = readPersistedDashboardSnapshotSync();
if (cachedSnapshot !== null) {
  restoreDashboardFromCache(queryClient, cachedSnapshot);
}

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <App />
      </MotionProvider>
    </QueryClientProvider>
  </StrictMode>
);
