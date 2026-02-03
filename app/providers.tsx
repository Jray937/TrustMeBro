'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Use a placeholder key during build if not provided
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';
  
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
