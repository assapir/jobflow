import { useEffect } from 'react';
import { Box, Center, Loader, Text, Stack } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

interface AuthCallbackProps {
  onComplete: () => void;
}

export function AuthCallback({ onComplete }: AuthCallbackProps) {
  const { setAuthFromCallback } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        await setAuthFromCallback(token);
      }

      // Clean up URL and redirect to main app
      window.history.replaceState({}, document.title, '/');
      onComplete();
    }

    handleCallback();
  }, [setAuthFromCallback, onComplete]);

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Center>
        <Stack align="center" gap="md">
          <Loader size="lg" color="cyan" />
          <Text c="dimmed">Completing sign in...</Text>
        </Stack>
      </Center>
    </Box>
  );
}
