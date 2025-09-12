'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { GlobalStyles } from '@/styles/GlobalStyles';
import { AuthProvider } from '@/contexts/AuthContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { Header } from '@/components/navigation/Header';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      <AuthProvider>
        <PresenceProvider>
          <Header />
          {children}
        </PresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}