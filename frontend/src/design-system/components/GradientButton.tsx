import { Button, type ButtonProps } from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";
import { tokens } from "../tokens";

type ButtonElementProps = ComponentPropsWithoutRef<"button">;

export interface GradientButtonProps
  extends Omit<ButtonProps, "variant" | "gradient">,
    Omit<ButtonElementProps, keyof ButtonProps> {
  /** Override the default gradient */
  gradient?: { from: string; to: string; deg?: number };
}

/**
 * Primary action button with the app's signature cyan-teal gradient.
 * Use for primary actions like "Add", "Save", "Import".
 */
export function GradientButton({
  gradient = tokens.gradients.primary,
  children,
  ...props
}: GradientButtonProps) {
  return (
    <Button variant="gradient" gradient={gradient} {...props}>
      {children}
    </Button>
  );
}
