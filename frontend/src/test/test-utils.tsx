import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MantineProvider, DirectionProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { theme } from "../theme";

// Create a new QueryClient for each test to ensure isolation
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestProviderProps {
  children: ReactNode;
}

function TestProviders({ children }: TestProviderProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}

// Wrapper for components that need DragDropContext
function DndTestProviders({ children }: TestProviderProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider>
        <MantineProvider theme={theme}>
          <DragDropContext onDragEnd={() => {}}>{children}</DragDropContext>
        </MantineProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}

// Custom render function
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// Custom render with DnD context
function renderWithDnd(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: DndTestProviders, ...options });
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render, renderWithDnd, createTestQueryClient };
