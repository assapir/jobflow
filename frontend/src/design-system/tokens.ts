/**
 * Design tokens for the Jobo application.
 * Centralizes colors, gradients, and other design primitives.
 */

export const tokens = {
  gradients: {
    /** Primary action gradient - cyan to teal */
    primary: {
      from: "#00d4ec",
      to: "#00a8bc",
      deg: 135,
    },
    /** Secondary gradient variant */
    secondary: {
      from: "#3ddff2",
      to: "#0092a4",
      deg: 135,
    },
  },
  colors: {
    cyan: {
      50: "#e0fcff",
      100: "#baf4fc",
      200: "#90ecf8",
      300: "#64e5f5",
      400: "#3ddff2",
      500: "#22d9ef",
      600: "#00d4ec",
      700: "#00bdd3",
      800: "#00a8bc",
      900: "#0092a4",
    },
  },
} as const;

