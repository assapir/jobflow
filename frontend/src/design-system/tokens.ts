/**
 * Design System Tokens
 *
 * Centralized color tokens, gradients, and borders used throughout the app.
 * These values were extracted from repeated patterns across components.
 */

export const tokens = {
  gradients: {
    /** Modal header background gradient */
    modalHeader: {
      dark: "linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.99) 100%)",
      light:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)",
    },
    /** Modal content background gradient */
    modalContent: {
      dark: "linear-gradient(180deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 25, 0.99) 100%)",
      light:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)",
    },
    /** Surface/card background gradient */
    surface: {
      dark: "linear-gradient(180deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)",
      light:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.98) 100%)",
    },
    /** Card background gradient */
    card: {
      dark: "linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)",
      light:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.98) 100%)",
    },
    /** Header background gradient */
    header: {
      dark: "linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.95) 100%)",
      light:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.95) 100%)",
    },
    /** Footer background gradient */
    footer: {
      dark: "linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)",
      light:
        "linear-gradient(180deg, rgba(248, 249, 250, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)",
    },
    /** Page background gradient */
    page: {
      dark: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
      light: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)",
    },
    /** Primary action button gradient */
    primary: {
      from: "cyan",
      to: "teal",
      deg: 135,
    },
    /** Drag state highlight gradient */
    dragHighlight:
      "linear-gradient(135deg, rgba(0, 212, 236, 0.25) 0%, rgba(0, 168, 188, 0.25) 100%)",
    /** Brand text gradient */
    brandText: "linear-gradient(135deg, #00d4ec 0%, #00a8bc 100%)",
  },
  borders: {
    /** Subtle border for cards, modals, sections */
    subtle: {
      dark: "rgba(255, 255, 255, 0.06)",
      light: "rgba(0, 0, 0, 0.08)",
    },
    /** Slightly more visible border for empty states */
    empty: {
      dark: "rgba(255, 255, 255, 0.1)",
      light: "rgba(0, 0, 0, 0.1)",
    },
    /** Drag active border */
    dragActive: "2px solid rgba(0, 212, 236, 0.7)",
  },
  shadows: {
    /** Card shadow */
    card: {
      dark: "0 4px 16px rgba(0, 0, 0, 0.2)",
      light: "0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    /** Drag state shadow */
    drag: "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 212, 236, 0.4)",
  },
  colors: {
    /** Card background for selectable items */
    cardBg: {
      dark: "rgba(255, 255, 255, 0.03)",
      light: "rgba(0, 0, 0, 0.02)",
    },
    /** Paper/container background */
    paper: {
      dark: "rgba(26, 26, 46, 0.9)",
      light: "rgba(255, 255, 255, 0.95)",
    },
    /** Drag over highlight */
    dragOver: "rgba(0, 212, 236, 0.08)",
  },
} as const;

/** Stage colors for kanban columns */
export const stageColors = {
  wishlist: "gray",
  applied: "blue",
  phone_screen: "violet",
  interview: "orange",
  offer: "green",
  rejected: "red",
} as const;
