import { Component, type ReactNode } from "react";
import {
  Box,
  Stack,
  Title,
  Text,
  Button,
  Code,
  Group,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCopy,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { getLastRequestId, ApiError } from "../api/client";
import { useThemeColors, GradientButton } from "../design-system";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  requestId: string | null;
}

function ErrorDisplay({
  error,
  requestId,
  onReset,
}: {
  error: Error;
  requestId: string | null;
  onReset: () => void;
}) {
  const { isDark, pageBg, cardBg, borderColor } = useThemeColors();

  const errorBorderColor = isDark
    ? "rgba(255, 100, 100, 0.3)"
    : "rgba(200, 50, 50, 0.2)";

  const errorIconBg = isDark
    ? "rgba(255, 100, 100, 0.15)"
    : "rgba(255, 100, 100, 0.1)";

  const codeBg = isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.08)";

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Box
        style={{
          background: cardBg,
          borderRadius: "16px",
          border: `1px solid ${errorBorderColor}`,
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <Stack align="center" gap="lg">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: errorIconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconAlertTriangle size={40} color="#ff6b6b" stroke={1.5} />
          </Box>

          <Stack gap="xs" align="center">
            <Title order={2} c={isDark ? "gray.1" : "gray.9"}>
              Something went wrong
            </Title>
            <Text c="dimmed" size="sm" maw={400}>
              An unexpected error occurred. Please try refreshing the page.
            </Text>
          </Stack>

          {requestId && (
            <Box
              style={{
                background: isDark
                  ? "rgba(0, 0, 0, 0.3)"
                  : "rgba(0, 0, 0, 0.05)",
                borderRadius: "8px",
                padding: "16px",
                width: "100%",
                border: `1px solid ${borderColor}`,
              }}
            >
              <Text size="xs" c="dimmed" mb="xs">
                Error Reference ID
              </Text>
              <Group justify="center" gap="xs">
                <Code
                  style={{
                    fontSize: "12px",
                    padding: "8px 12px",
                    background: codeBg,
                  }}
                >
                  {requestId}
                </Code>
                <CopyButton value={requestId} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied!" : "Copy ID"}
                      withArrow
                      position="right"
                    >
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Share this ID when reporting the issue
              </Text>
            </Box>
          )}

          {import.meta.env.DEV && (
            <Box
              style={{
                background: errorIconBg,
                borderRadius: "8px",
                padding: "12px",
                width: "100%",
                textAlign: "left",
                border: `1px solid ${errorBorderColor}`,
              }}
            >
              <Text size="xs" c="red.6" fw={600} mb="xs">
                {error.name}: {error.message}
              </Text>
              {error.stack && (
                <Code
                  block
                  style={{
                    fontSize: "10px",
                    maxHeight: "150px",
                    overflow: "auto",
                  }}
                >
                  {error.stack}
                </Code>
              )}
            </Box>
          )}

          <Group gap="sm">
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={onReset}
              variant="light"
              color="gray"
            >
              Try Again
            </Button>
            <GradientButton onClick={() => window.location.reload()}>
              Refresh Page
            </GradientButton>
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      requestId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    let requestId: string | null = null;
    if (error instanceof ApiError) {
      requestId = error.requestId;
    } else {
      requestId = getLastRequestId();
    }

    return {
      hasError: true,
      error,
      requestId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      requestId: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorDisplay
          error={this.state.error}
          requestId={this.state.requestId}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
