import type { Preview } from "@storybook/react";
import { MantineProvider } from "@mantine/core";
import { theme } from "../src/theme";
import "@mantine/core/styles.css";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0f" },
        { name: "light", value: "#f8f9fa" },
      ],
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Story />
      </MantineProvider>
    ),
  ],
};

export default preview;
