import type { Meta, StoryObj } from "@storybook/react";
import { IconPlus, IconDownload, IconCheck } from "@tabler/icons-react";
import { GradientButton } from "./GradientButton";

const meta = {
  title: "Design System/GradientButton",
  component: GradientButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof GradientButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Click me",
  },
};

export const WithIcon: Story = {
  args: {
    children: "Add Item",
    leftSection: <IconPlus size={16} stroke={2} />,
  },
};

export const Loading: Story = {
  args: {
    children: "Saving...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <GradientButton size="xs">Extra Small</GradientButton>
      <GradientButton size="sm">Small</GradientButton>
      <GradientButton size="md">Medium</GradientButton>
      <GradientButton size="lg">Large</GradientButton>
      <GradientButton size="xl">Extra Large</GradientButton>
    </div>
  ),
};

export const CustomGradient: Story = {
  args: {
    children: "Custom Gradient",
    gradient: { from: "indigo", to: "pink", deg: 45 },
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Download",
    rightSection: <IconDownload size={16} stroke={2} />,
  },
};

export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
    leftSection: <IconCheck size={16} stroke={2} />,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};
