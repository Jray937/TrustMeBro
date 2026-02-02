'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [text, setText] = useState('');
  const fullText = "Welcome to Trust Me Bro Capital!";

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Typing speed

    return () => clearInterval(interval);
  }, []);

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
                        rootBox: {
                            mx: "auto"
                        }
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
            }}
          >
            {text}
          </Typography>
        </SignedIn>
      </Box>
    </Container>
  );
}
