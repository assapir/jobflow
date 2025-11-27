import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Mock window.matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Mantine components
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = ResizeObserverMock;

// Mock @mantine/notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
    hide: vi.fn(),
    update: vi.fn(),
    clean: vi.fn(),
    cleanQueue: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock @mantine/hooks useMediaQuery
vi.mock("@mantine/hooks", async () => {
  const actual = await vi.importActual("@mantine/hooks");
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false),
  };
});

// Global fetch mock
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Reset mocks before each test
beforeEach(() => {
  mockFetch.mockReset();
});

// Export for use in tests
export { mockFetch };
