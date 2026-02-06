'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  AccountCircle,
  Add as AddIcon,
  MonitorHeart as HealthIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

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

interface ApiHolding {
  id: string | number;
  symbol: string;
  name: string;
  shares: number;
  avg_price: number;
  avgPrice?: number;
  currentPrice?: number;
  priceData?: {
    last?: number;
    lastPrice?: number;
  };
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newAvgPrice, setNewAvgPrice] = useState('');
  const [addingHolding, setAddingHolding] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const transformHoldings = (data: ApiHolding[]): Holding[] => {
    return data.map((item) => {
      const avgPrice = Number(item.avg_price ?? item.avgPrice ?? 0);
      const shares = Number(item.shares ?? 0);
      const currentPrice = Number(
        item.currentPrice ??
          item.priceData?.last ??
          item.priceData?.lastPrice ??
          avgPrice,
      );
      const value = currentPrice * shares;
      const change = (currentPrice - avgPrice) * shares;
      const changePercent =
        avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

      return {
        id: String(item.id),
        symbol: item.symbol,
        name: item.name,
        shares,
        avgPrice,
        currentPrice,
        value,
        change,
        changePercent,
      };
    });
  };

  const fetchHoldings = useCallback(async () => {
    setLoadingHoldings(true);
    setHoldingsError(null);
    try {
      const response = await fetch(`${apiUrl}/api/holdings`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: ApiHolding[] = await response.json();
      setHoldings(transformHoldings(data || []));
    } catch (err) {
      setHoldings([]);
      setHoldingsError(
        err instanceof Error ? err.message : 'Failed to load holdings',
      );
    } finally {
      setLoadingHoldings(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAddHolding = async () => {
    if (!newSymbol || !newName || !newShares || !newAvgPrice) {
      setHoldingsError('Please fill in Symbol, Name, Shares, and Average Price');
      return;
    }

    const sharesNumber = parseFloat(newShares);
    const avgPriceNumber = parseFloat(newAvgPrice);

    if (Number.isNaN(sharesNumber) || Number.isNaN(avgPriceNumber)) {
      setHoldingsError('Shares and average price must be valid numbers');
      return;
    }

    setHoldingsError(null);
    setAddingHolding(true);
    try {
      const response = await fetch(`${apiUrl}/api/holdings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          name: newName,
          shares: sharesNumber,
          avg_price: avgPriceNumber,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage =
          errorBody?.error || `Failed to add holding (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      await fetchHoldings();
      setNewSymbol('');
      setNewName('');
      setNewShares('');
      setNewAvgPrice('');
    } catch (err) {
      setHoldingsError(
        err instanceof Error ? err.message : 'Failed to add holding',
      );
    } finally {
      setAddingHolding(false);
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalChange = holdings.reduce((sum, h) => sum + h.change, 0);
  const costBasis = holdings.reduce((sum, h) => sum + h.avgPrice * h.shares, 0);
  const totalChangePercent = costBasis
    ? (totalChange / costBasis) * 100
    : 0;

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
            mb: 1,
          }}
          onClick={() => setCurrentTab(2)}
        >
          Trading
        </Button>
        <Button
          fullWidth
          startIcon={<HealthIcon />}
          sx={{
            justifyContent: 'flex-start',
            color: currentTab === 3 ? 'primary.main' : 'text.secondary',
            backgroundColor: currentTab === 3 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
            },
          }}
          onClick={() => setCurrentTab(3)}
        >
          System Health
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
              label="Name"
              variant="outlined"
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              sx={{ flex: 1, minWidth: 200 }}
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
            <TextField
              label="Average Price"
              variant="outlined"
              size="small"
              type="number"
              value={newAvgPrice}
              onChange={(e) => setNewAvgPrice(e.target.value)}
              sx={{ flex: 1, minWidth: 180 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHolding}
              disabled={addingHolding}
            >
              {addingHolding ? 'Adding...' : 'Add'}
            </Button>
          </Box>
          {holdingsError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {holdingsError}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Holdings
          </Typography>
          {loadingHoldings && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {!loadingHoldings && holdingsError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {holdingsError}
            </Alert>
          )}
          {!loadingHoldings && !holdingsError && holdings.length === 0 && (
            <Typography color="text.secondary">No holdings found.</Typography>
          )}
          {!loadingHoldings && holdings.map((holding) => (
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
                marginTop: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {holding.symbol}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {holding.name} • {holding.shares} shares @ ${holding.avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
    const maxValue = holdings.length ? Math.max(...holdings.map(h => h.value)) : 0;
    
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
                const size = maxValue > 0 ? Math.max(100, (holding.value / maxValue) * 300) : 120;
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
  const TradingTab = ({ holdings }: { holdings: Holding[] }) => {
    const [selectedTicker, setSelectedTicker] = useState('');
    const [chatMessages, setChatMessages] = useState<string[]>([
      'Welcome to Trust Me Bro Trading!',
      'Select a ticker to view its chart.',
    ]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
      if (holdings.length && !selectedTicker) {
        setSelectedTicker(holdings[0].symbol);
      }
    }, [holdings, selectedTicker]);

    const handleSendMessage = () => {
      if (chatInput.trim()) {
        setChatMessages([...chatMessages, `You: ${chatInput}`, "Bot: Trust me bro, that's a great trade!"]);
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
                  {selectedTicker ? (
                    <iframe
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${selectedTicker}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0f172a&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${selectedTicker}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 8,
                      }}
                      title="TradingView Chart"
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Add a holding to view its chart.
                    </Typography>
                  )}
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

  // Health Tab Content
  const HealthTab = () => {
    const [status, setStatus] = useState<'loading' | 'healthy' | 'unhealthy'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const checkHealth = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
          const response = await fetch(`${apiUrl}/api/health`);
          if (response.ok) {
            setStatus('healthy');
          } else {
            setStatus('unhealthy');
            setError(`HTTP Error: ${response.status}`);
          }
        } catch (err) {
          setStatus('unhealthy');
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      };

      checkHealth();
    }, []);

    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          System Health
        </Typography>
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, textAlign: 'center' }}>
            {status === 'loading' && (
              <Box>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h6">Checking connection to Uncle backend...</Typography>
              </Box>
            )}

            {status === 'healthy' && (
              <Box>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" color="success.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  System Healthy
                </Typography>
                <Typography color="text.secondary">
                  Successfully connected to the backend API. All systems operational.
                </Typography>
              </Box>
            )}

            {status === 'unhealthy' && (
              <Box sx={{ width: '100%' }}>
                <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" color="error.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Connection Failed
                </Typography>
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {error || 'Could not connect to the backend service.'}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
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
              {currentTab === 0 ? 'Portfolio' : currentTab === 1 ? 'Heatmap' : currentTab === 2 ? 'Trading' : 'System Health'}
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
          {currentTab === 2 && <TradingTab holdings={holdings} />}
          {currentTab === 3 && <HealthTab />}
        </Box>
      </Box>
    </Box>
  );
}
