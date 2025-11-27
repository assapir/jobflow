import { Modal, type ModalProps } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useThemeColors } from "../hooks/useThemeColors";

export interface AppModalProps extends Omit<ModalProps, "styles"> {
  /** Enable fullscreen on mobile devices (default: true) */
  fullScreenOnMobile?: boolean;
}

/**
 * Pre-styled Modal component with consistent theming.
 * Automatically applies theme-aware background gradients and borders.
 */
export function AppModal({
  fullScreenOnMobile = true,
  children,
  ...props
}: AppModalProps) {
  const { modalHeaderBg, modalContentBg, borderColor } = useThemeColors();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Modal
      fullScreen={fullScreenOnMobile && isMobile}
      styles={{
        header: {
          background: modalHeaderBg,
          borderBottom: `1px solid ${borderColor}`,
        },
        content: {
          background: modalContentBg,
        },
      }}
      {...props}
    >
      {children}
    </Modal>
  );
}
