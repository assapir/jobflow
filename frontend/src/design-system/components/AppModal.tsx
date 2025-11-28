import { Modal, type ModalProps } from "@mantine/core";
import type { ReactNode } from "react";

export interface AppModalProps extends Omit<ModalProps, "children"> {
  /** Modal content */
  children: ReactNode;
  /** Whether to go fullscreen on mobile (default: true) */
  fullScreenOnMobile?: boolean;
}

/**
 * App-wide modal component with consistent theming.
 * Wraps Mantine Modal with default styling for the Jobo app.
 */
export function AppModal({
  children,
  fullScreenOnMobile = true,
  ...props
}: AppModalProps) {
  return (
    <Modal
      {...props}
      fullScreen={fullScreenOnMobile ? undefined : false}
      styles={{
        header: {
          borderBottom: "1px solid var(--mantine-color-dark-4)",
        },
        title: {
          fontWeight: 600,
        },
      }}
    >
      {children}
    </Modal>
  );
}
