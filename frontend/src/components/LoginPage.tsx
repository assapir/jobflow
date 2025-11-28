import { useState } from "react";
import {
  Box,
  Button,
  Center,
  Stack,
  Text,
  Title,
  Paper,
  Alert,
  Divider,
} from "@mantine/core";
import { IconBrandLinkedin } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useThemeColors } from "../design-system";

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
  const { pageBg, paperBg } = useThemeColors();
  const [loginError, setLoginError] = useState<string | null>(null);

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
        background: pageBg,
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
            background: paperBg,
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
                  leftSection={<IconBrandLinkedin size={20} />}
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
