import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider, DirectionProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/global.css";
import "./i18n";
import App from "./App";
import { theme } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <QueryClientProvider client={queryClient}>
        <DirectionProvider initialDirection="ltr">
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <ErrorBoundary>
              <AuthProvider>
                <Notifications position="top-right" />
                <App />
              </AuthProvider>
            </ErrorBoundary>
          </MantineProvider>
        </DirectionProvider>
      </QueryClientProvider>
    </Suspense>
  </StrictMode>
);
