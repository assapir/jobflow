import { useMantineColorScheme } from "@mantine/core";
import { tokens } from "../tokens";

/**
 * Hook that returns all theme-aware colors based on current color scheme.
 * Replaces repeated colorScheme checks across components.
 */
export function useThemeColors() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return {
    // Color scheme
    colorScheme,
    isDark,

    // Modal backgrounds
    modalHeaderBg: isDark
      ? tokens.gradients.modalHeader.dark
      : tokens.gradients.modalHeader.light,
    modalContentBg: isDark
      ? tokens.gradients.modalContent.dark
      : tokens.gradients.modalContent.light,

    // Surface backgrounds
    surfaceBg: isDark
      ? tokens.gradients.surface.dark
      : tokens.gradients.surface.light,
    cardBg: isDark ? tokens.gradients.card.dark : tokens.gradients.card.light,
    headerBg: isDark
      ? tokens.gradients.header.dark
      : tokens.gradients.header.light,
    footerBg: isDark
      ? tokens.gradients.footer.dark
      : tokens.gradients.footer.light,
    pageBg: isDark ? tokens.gradients.page.dark : tokens.gradients.page.light,

    // Borders
    borderColor: isDark
      ? tokens.borders.subtle.dark
      : tokens.borders.subtle.light,
    emptyBorderColor: isDark
      ? tokens.borders.empty.dark
      : tokens.borders.empty.light,

    // Shadows
    cardShadow: isDark ? tokens.shadows.card.dark : tokens.shadows.card.light,

    // Colors
    selectableCardBg: isDark
      ? tokens.colors.cardBg.dark
      : tokens.colors.cardBg.light,
    paperBg: isDark ? tokens.colors.paper.dark : tokens.colors.paper.light,

    // Static values (don't change with theme)
    dragHighlightBg: tokens.gradients.dragHighlight,
    dragOverBg: tokens.colors.dragOver,
    dragBorder: tokens.borders.dragActive,
    dragShadow: tokens.shadows.drag,
    brandTextGradient: tokens.gradients.brandText,
    primaryGradient: tokens.gradients.primary,
  } as const;
}

export type ThemeColors = ReturnType<typeof useThemeColors>;
