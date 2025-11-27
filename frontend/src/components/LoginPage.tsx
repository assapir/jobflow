import { useState } from "react";
import {
  Box,
  Button,
  Center,
  Stack,
  Text,
  Title,
  Paper,
  useMantineColorScheme,
  Alert,
  Divider,
} from "@mantine/core";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  error?: string | null;
}

// Login page always displays in English for consistency
const loginText = {
  title: "JobFlow",
  tagline: "Where applications flow, offers follow",
  signInPrompt: "Sign in to access your job applications",
  signInWithLinkedIn: "Sign in with LinkedIn",
  devLogin: "Dev Login (Bypass Auth)",
  privacyNote: "We only access your basic profile information",
  linkedInNotConfigured:
    "LinkedIn OAuth not configured. Use Dev Login or configure LinkedIn credentials.",
  errors: {
    accessDenied: "You denied access to your LinkedIn account",
    invalidRequest: "Invalid authentication request",
    invalidState: "Authentication session expired. Please try again.",
    authFailed: "Authentication failed. Please try again.",
  },
};

export function LoginPage({ error }: LoginPageProps) {
  const { login, devLogin, isLoading, authStatus } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const [loginError, setLoginError] = useState<string | null>(null);

  const bgGradient =
    colorScheme === "dark"
      ? "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)"
      : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)";

  const handleLogin = async () => {
    try {
      setLoginError(null);
      await login();
    } catch (err) {
      console.error("Login failed:", err);
      if (err instanceof Error && err.message === "LINKEDIN_NOT_CONFIGURED") {
        setLoginError(loginText.linkedInNotConfigured);
      } else {
        setLoginError("Login failed. Please try again.");
      }
    }
  };

  const handleDevLogin = async () => {
    try {
      setLoginError(null);
      await devLogin();
    } catch (err) {
      console.error("Dev login failed:", err);
      setLoginError("Dev login failed. Please try again.");
    }
  };

  const getErrorMessage = (errorCode: string | null | undefined) => {
    switch (errorCode) {
      case "access_denied":
        return loginText.errors.accessDenied;
      case "invalid_request":
        return loginText.errors.invalidRequest;
      case "invalid_state":
        return loginText.errors.invalidState;
      case "auth_failed":
        return loginText.errors.authFailed;
      default:
        return null;
    }
  };

  const errorMessage = getErrorMessage(error) || loginError;
  const showDevLogin = authStatus?.devAuthEnabled;
  const linkedInConfigured = authStatus?.linkedInConfigured;

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: bgGradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Center>
        <Paper
          shadow="xl"
          p="xl"
          radius="lg"
          style={{
            maxWidth: 400,
            width: "100%",
            background:
              colorScheme === "dark"
                ? "rgba(26, 26, 46, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack align="center" gap="lg">
            <Box style={{ textAlign: "center" }}>
              <Title order={1} size="h2" mb="xs">
                {loginText.title}
              </Title>
              <Text c="dimmed" size="sm">
                {loginText.tagline}
              </Text>
            </Box>

            {errorMessage && (
              <Alert color="red" variant="light" style={{ width: "100%" }}>
                {errorMessage}
              </Alert>
            )}

            <Stack gap="md" style={{ width: "100%" }}>
              <Text size="sm" c="dimmed" ta="center">
                {loginText.signInPrompt}
              </Text>

              {linkedInConfigured && (
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleLogin}
                  loading={isLoading}
                  leftSection={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  }
                  styles={{
                    root: {
                      backgroundColor: "#0077B5",
                      "&:hover": {
                        backgroundColor: "#006097",
                      },
                    },
                  }}
                >
                  {loginText.signInWithLinkedIn}
                </Button>
              )}

              {showDevLogin && (
                <>
                  {linkedInConfigured && (
                    <Divider label="or" labelPosition="center" />
                  )}
                  <Button
                    size="lg"
                    fullWidth
                    variant="outline"
                    color="orange"
                    onClick={handleDevLogin}
                    loading={isLoading}
                  >
                    {loginText.devLogin}
                  </Button>
                  {!linkedInConfigured && (
                    <Alert color="yellow" variant="light">
                      {loginText.linkedInNotConfigured}
                    </Alert>
                  )}
                </>
              )}
            </Stack>

            {linkedInConfigured && (
              <Text size="xs" c="dimmed" ta="center">
                {loginText.privacyNote}
              </Text>
            )}
          </Stack>
        </Paper>
      </Center>
    </Box>
  );
}
