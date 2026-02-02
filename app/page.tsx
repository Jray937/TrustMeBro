'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from "@clerk/nextjs";

export default function Home() {
  const [text, setText] = useState('');
  const [apiData, setApiData] = useState<string>('Initializing secure connection...');
  const { getToken } = useAuth();
  const fullText = "Welcome to Trust Me Bro Capital!";

  // Typing effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Fetch backend data
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          setApiData("Error: NEXT_PUBLIC_API_URL not configured.");
          return;
        }

        const res = await fetch(`${apiUrl}/api/private`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setApiData(`[SECURE LINK ESTABLISHED]\nResponse: ${JSON.stringify(data, null, 2)}`);
        } else {
          setApiData(`[CONNECTION FAILED]: Status ${res.status}`);
        }
      } catch (error) {
        setApiData(`[NETWORK ERROR]: ${error}`);
      }
    };

    // Only run this if we are likely logged in (SignedIn component handles UI, but logic runs here)
    // We add a small delay to ensure Clerk is ready or just rely on getToken
    const timeoutId = setTimeout(() => {
        checkBackend();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [getToken]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <SignedOut>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ color: '#00ff00', mb: 4, fontFamily: 'monospace' }}>
              ACCESS RESTRICTED. LOGIN REQUIRED.
            </Typography>
            <SignIn 
                routing="hash" 
                appearance={{
                    elements: {
                        rootBox: { mx: "auto" }
                    }
                }}
            />
          </Box>
        </SignedOut>
        
        <SignedIn>
          <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
            <UserButton />
          </Box>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: 'monospace',
              color: '#00ff00',
              textShadow: '0 0 10px #00ff00',
              borderRight: '2px solid #00ff00',
              whiteSpace: 'normal',
              overflow: 'hidden',
              animation: 'blink 1s step-end infinite',
              '@keyframes blink': {
                '0%, 100%': { borderColor: 'transparent' },
                '50%': { borderColor: '#00ff00' },
              },
              mb: 4
            }}
          >
            {text}
          </Typography>

          {/* Backend Connection Status Display */}
          <Box 
            sx={{ 
                width: '100%', 
                maxWidth: '600px',
                border: '1px dashed #00cc00', 
                p: 2, 
                backgroundColor: 'rgba(0, 255, 0, 0.05)',
                textAlign: 'left'
            }}
          >
            <Typography variant="caption" sx={{ color: '#00cc00', display: 'block', mb: 1 }}>
              // SYSTEM DIAGNOSTICS:
            </Typography>
            <pre style={{ color: '#00ff00', margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {apiData}
            </pre>
          </Box>
        </SignedIn>
      </Box>
    </Container>
  );
}
