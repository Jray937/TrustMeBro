'use client';

import { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  AccountCircle,
  Add as AddIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

// Mock data for portfolio holdings
interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
}

const mockHoldings: Holding[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgPrice: 150, currentPrice: 175, value: 8750, change: 1250, changePercent: 16.67 },
  { id: '2', symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 30, avgPrice: 2800, currentPrice: 2950, value: 88500, change: 4500, changePercent: 5.36 },
  { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', shares: 40, avgPrice: 300, currentPrice: 320, value: 12800, change: 800, changePercent: 6.67 },
  { id: '4', symbol: 'TSLA', name: 'Tesla Inc.', shares: 25, avgPrice: 700, currentPrice: 680, value: 17000, change: -500, changePercent: -2.86 },
  { id: '5', symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 35, avgPrice: 450, currentPrice: 520, value: 18200, change: 2450, changePercent: 15.56 },
];

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>(mockHoldings);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAddHolding = () => {
    if (newSymbol && newShares) {
      const shares = parseFloat(newShares);
      const mockPrice = Math.random() * 500 + 50;
      const newHolding: Holding = {
        id: Date.now().toString(),
        symbol: newSymbol.toUpperCase(),
        name: `${newSymbol.toUpperCase()} Company`,
        shares: shares,
        avgPrice: mockPrice,
        currentPrice: mockPrice * (1 + (Math.random() * 0.2 - 0.1)),
        value: shares * mockPrice,
        change: 0,
        changePercent: 0,
      };
      newHolding.change = newHolding.value - (newHolding.shares * newHolding.avgPrice);
      newHolding.changePercent = (newHolding.change / (newHolding.shares * newHolding.avgPrice)) * 100;
      setHoldings([...holdings, newHolding]);
      setNewSymbol('');
      setNewShares('');
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalChange = holdings.reduce((sum, h) => sum + h.change, 0);
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100;

  // Sidebar content
  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Trust Me Bro
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Investment Dashboard
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<DashboardIcon />}
          sx={{
            justifyContent: 'flex-start',
            mb: 1,
            color: currentTab === 0 ? 'primary.main' : 'text.secondary',
            backgroundColor: currentTab === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
            },
          }}
          onClick={() => setCurrentTab(0)}
        >
          Portfolio
        </Button>
        <Button
          fullWidth
          startIcon={<TrendingUpIcon />}
          sx={{
            justifyContent: 'flex-start',
            mb: 1,
            color: currentTab === 1 ? 'primary.main' : 'text.secondary',
            backgroundColor: currentTab === 1 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
            },
          }}
          onClick={() => setCurrentTab(1)}
        >
          Heatmap
        </Button>
        <Button
          fullWidth
          startIcon={<ShowChartIcon />}
          sx={{
            justifyContent: 'flex-start',
            color: currentTab === 2 ? 'primary.main' : 'text.secondary',
            backgroundColor: currentTab === 2 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
            },
          }}
          onClick={() => setCurrentTab(2)}
        >
          Trading
        </Button>
      </Box>
    </Box>
  );

  // Portfolio Tab Content
  const PortfolioTab = () => (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Portfolio Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                  Total Value
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                  Total Change
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: totalChange >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  ${totalChange >= 0 ? '+' : ''}{totalChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                  Change %
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: totalChangePercent >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New Holding
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Symbol"
              variant="outlined"
              size="small"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              sx={{ flex: 1, minWidth: 150 }}
            />
            <TextField
              label="Shares"
              variant="outlined"
              size="small"
              type="number"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              sx={{ flex: 1, minWidth: 150 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHolding}
            >
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Holdings
          </Typography>
          {holdings.map((holding) => (
            <Box
              key={holding.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                mb: 1,
                backgroundColor: 'background.default',
                borderRadius: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {holding.symbol}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {holding.name} • {holding.shares} shares
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
                <Chip
                  label={`${holding.changePercent >= 0 ? '+' : ''}${holding.changePercent.toFixed(2)}%`}
                  size="small"
                  sx={{
                    backgroundColor: holding.changePercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: holding.changePercent >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  // Heatmap Tab Content
  const HeatmapTab = () => {
    const maxValue = Math.max(...holdings.map(h => h.value));
    
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Portfolio Heatmap
        </Typography>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {holdings.map((holding) => {
                const size = Math.max(100, (holding.value / maxValue) * 300);
                return (
                  <Paper
                    key={holding.id}
                    sx={{
                      width: size,
                      height: size,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: holding.changePercent >= 0
                        ? `rgba(16, 185, 129, ${Math.min(0.3 + Math.abs(holding.changePercent) / 50, 0.8)})`
                        : `rgba(239, 68, 68, ${Math.min(0.3 + Math.abs(holding.changePercent) / 50, 0.8)})`,
                      border: '1px solid',
                      borderColor: holding.changePercent >= 0 ? 'success.main' : 'error.main',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        zIndex: 10,
                      },
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                      {holding.symbol}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                      ${holding.value.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'white', fontWeight: 600, mt: 1 }}
                    >
                      {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Trading Tab Content
  const TradingTab = () => {
    const [selectedTicker, setSelectedTicker] = useState('AAPL');
    const [chatMessages, setChatMessages] = useState<string[]>([
      'Welcome to Trust Me Bro Trading!',
      'Select a ticker to view its chart.',
    ]);
    const [chatInput, setChatInput] = useState('');

    const handleSendMessage = () => {
      if (chatInput.trim()) {
        setChatMessages([...chatMessages, `You: ${chatInput}`, 'Bot: Trust me bro, that\'s a great trade!']);
        setChatInput('');
      }
    };

    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Trading Terminal
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '2 1 600px' }}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    select
                    label="Select Ticker"
                    value={selectedTicker}
                    onChange={(e) => setSelectedTicker(e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                    fullWidth
                  >
                    {holdings.map((h) => (
                      <option key={h.symbol} value={h.symbol}>
                        {h.symbol} - {h.name}
                      </option>
                    ))}
                  </TextField>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 500,
                    backgroundColor: 'background.default',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <iframe
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${selectedTicker}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0f172a&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_side_toolbar=0`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: 8,
                    }}
                    title="TradingView Chart"
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 350px' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Trading Assistant
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    mb: 2,
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  {chatMessages.map((msg, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        mb: 1,
                        p: 1,
                        backgroundColor: msg.startsWith('You:') ? 'primary.main' : 'background.paper',
                        borderRadius: 1,
                        color: msg.startsWith('You:') ? 'white' : 'text.primary',
                      }}
                    >
                      {msg}
                    </Typography>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ask for trading advice..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button variant="contained" onClick={handleSendMessage}>
                    Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {currentTab === 0 ? 'Portfolio' : currentTab === 1 ? 'Heatmap' : 'Trading'}
            </Typography>
            <IconButton color="inherit">
              <Avatar sx={{ width: 32, height: 32, backgroundColor: 'primary.main' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ p: 3 }}>
          {currentTab === 0 && <PortfolioTab />}
          {currentTab === 1 && <HeatmapTab />}
          {currentTab === 2 && <TradingTab />}
        </Box>
      </Box>
    </Box>
  );
}
