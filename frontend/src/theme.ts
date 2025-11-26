import { createTheme, MantineColorsTuple } from "@mantine/core";

const cyan: MantineColorsTuple = [
  "#e0fcff",
  "#baf4fc",
  "#90ecf8",
  "#64e5f5",
  "#3ddff2",
  "#22d9ef",
  "#00d4ec",
  "#00bdd3",
  "#00a8bc",
  "#0092a4",
];

export const theme = createTheme({
  primaryColor: "cyan",
  colors: {
    cyan,
  },
  fontFamily: '"JetBrains Mono", monospace',
  headings: {
    fontFamily: '"JetBrains Mono", monospace',
  },
  defaultRadius: "md",
  components: {
    Card: {
      defaultProps: {
        shadow: "sm",
        padding: "lg",
        radius: "md",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
      },
    },
  },
});
