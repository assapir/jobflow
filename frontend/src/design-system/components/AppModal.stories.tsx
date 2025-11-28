import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button, Text, Stack, TextInput, Group } from "@mantine/core";
import { AppModal } from "./AppModal";
import { GradientButton } from "./GradientButton";

const meta = {
  title: "Design System/AppModal",
  component: AppModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    centered: {
      control: "boolean",
    },
    fullScreenOnMobile: {
      control: "boolean",
    },
    opened: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof AppModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component that manages modal state
function ModalDemo({
  children,
  ...props
}: Omit<Parameters<typeof AppModal>[0], "opened" | "onClose">) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onClick={() => setOpened(true)}>Open Modal</Button>
      <AppModal {...props} opened={opened} onClose={() => setOpened(false)}>
        {children}
      </AppModal>
    </>
  );
}

export const Default: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Modal Title",
    size: "md",
    children: <Text>This is the modal content with consistent theming.</Text>,
  },
};

export const WithForm: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Add New Item",
    size: "md",
    children: (
      <Stack gap="md">
        <TextInput label="Name" placeholder="Enter name" />
        <TextInput label="Email" placeholder="Enter email" />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle">Cancel</Button>
          <GradientButton>Save</GradientButton>
        </Group>
      </Stack>
    ),
  },
};

export const Small: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Confirm Action",
    size: "sm",
    children: (
      <>
        <Text size="sm" mb="lg">
          Are you sure you want to delete this item?
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle">Cancel</Button>
          <Button color="red">Delete</Button>
        </Group>
      </>
    ),
  },
};

export const Large: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Large Modal",
    size: "lg",
    children: (
      <Stack gap="md">
        <Text>
          This is a larger modal for more complex content. It provides more
          space for forms, lists, or detailed information.
        </Text>
        <TextInput label="Field 1" placeholder="Enter value" />
        <TextInput label="Field 2" placeholder="Enter value" />
        <TextInput label="Field 3" placeholder="Enter value" />
        <TextInput label="Field 4" placeholder="Enter value" />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle">Cancel</Button>
          <GradientButton>Submit</GradientButton>
        </Group>
      </Stack>
    ),
  },
};

export const NoFullScreenOnMobile: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Compact Modal",
    size: "sm",
    fullScreenOnMobile: false,
    children: (
      <Text>This modal won't go fullscreen on mobile devices.</Text>
    ),
  },
};

export const Centered: Story = {
  args: {
    opened: true,
    onClose: () => {},
    title: "Centered Modal",
    size: "md",
    centered: true,
    children: <Text>This modal is vertically centered on the screen.</Text>,
  },
};

export const Interactive: Story = {
  render: () => (
    <ModalDemo title="Interactive Modal" size="md">
      <Text>Click the button above to open this modal interactively.</Text>
    </ModalDemo>
  ),
  args: {
    opened: false,
    onClose: () => {},
    children: null,
  },
};
