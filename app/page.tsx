'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
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
  Autocomplete,
  Link,
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
  Article as ArticleIcon,
} from '@mui/icons-material';

const drawerWidth = 240;
const DEFAULT_API_URL = 'https://api.uncle.tmb-capital.com';
const STOCK_SEARCH_DEBOUNCE_MS = 300;

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

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface StockSearchResult {
  symbol: string;
  name: string;
}

export default function Home() {
  const { getToken } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newSymbol, setNewSymbol] = useState<StockSearchResult | null>(null);
  const [newShares, setNewShares] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<StockSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [isSearchingStocks, setIsSearchingStocks] = useState(false);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [addHoldingError, setAddHoldingError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

  // Fetch holdings from backend
  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoadingHoldings(true);
      setHoldingsError(null);
      try {
        const token = await getToken();
        const response = await fetch(`${apiUrl}/api/holdings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setHoldings(data);
          } else {
            setHoldings([]);
            setHoldingsError('Unexpected holdings response format');
          }
        } else {
          setHoldingsError(`Failed to fetch holdings: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching holdings:', error);
        setHoldingsError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoadingHoldings(false);
      }
    };

    fetchHoldings();
  }, [apiUrl, getToken]);

  // Fetch news from backend
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoadingNews(true);
      setNewsError(null);
      try {
        const token = await getToken();
        const response = await fetch(`${apiUrl}/api/news`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setNews(data);
          } else {
            setNews([]);
            setNewsError('Unexpected news response format');
          }
        } else {
          setNewsError(`Failed to fetch news: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, [apiUrl, getToken]);

  // Search for stock symbols
  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.length < 1) {
        setStockSearchResults([]);
        setIsSearchingStocks(false);
        return;
      }

      setIsSearchingStocks(true);
      try {
        const token = await getToken();
        const response = await fetch(`${apiUrl}/api/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStockSearchResults(data);
        } else {
          console.error(`Stock search failed: ${response.status}`);
          setStockSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
        setStockSearchResults([]);
      } finally {
        setIsSearchingStocks(false);
      }
    };

    const timeoutId = setTimeout(searchStocks, STOCK_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, apiUrl, getToken]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAddHolding = async () => {
    if (newSymbol && newShares && newPrice) {
      setIsAddingHolding(true);
      setAddHoldingError(null);
      try {
        const token = await getToken();
        const response = await fetch(`${apiUrl}/api/holdings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: newSymbol.symbol,
            shares: parseFloat(newShares),
            avgPrice: parseFloat(newPrice),
          }),
        });

        if (response.ok) {
          // Refresh holdings list
          const holdingsResponse = await fetch(`${apiUrl}/api/holdings`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (holdingsResponse.ok) {
            const data = await holdingsResponse.json();
            setHoldings(data);
          }
          
          // Clear form
          setNewSymbol(null);
          setNewShares('');
          setNewPrice('');
        } else {
          const errorText = await response.text();
          setAddHoldingError(`Failed to add holding: ${response.status} ${errorText || response.statusText}`);
        }
      } catch (error) {
        console.error('Error adding holding:', error);
        setAddHoldingError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsAddingHolding(false);
      }
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalChange = holdings.reduce((sum, h) => sum + h.change, 0);
  const denominator = totalValue - totalChange;
  const totalChangePercent = denominator !== 0 ? (totalChange / denominator) * 100 : 0;

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
          {addHoldingError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddHoldingError(null)}>
              {addHoldingError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Autocomplete
              sx={{ flex: 1, minWidth: 200 }}
              options={stockSearchResults}
              getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
              value={newSymbol}
              onChange={(_, value) => setNewSymbol(value)}
              onInputChange={(_, value) => setSearchQuery(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Stock Symbol"
                  variant="outlined"
                  size="small"
                />
              )}
              loading={isSearchingStocks}
              noOptionsText={searchQuery.length > 0 ? "No stocks found" : "Start typing to search"}
            />
            <TextField
              label="Shares"
              variant="outlined"
              size="small"
              type="number"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              label="Avg Price"
              variant="outlined"
              size="small"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHolding}
              disabled={isAddingHolding || !newSymbol || !newShares || !newPrice}
            >
              {isAddingHolding ? 'Adding...' : 'Add'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Holdings
          </Typography>
          {holdingsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {holdingsError}
            </Alert>
          )}
          {isLoadingHoldings ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : holdings.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
              No holdings yet. Add your first holding above.
            </Typography>
          ) : (
            holdings.map((holding) => (
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
            ))
          )}
        </CardContent>
      </Card>

      {/* News Feed Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon />
            Market News
          </Typography>
          {newsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {newsError}
            </Alert>
          )}
          {isLoadingNews ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : news.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
              No news available at the moment.
            </Typography>
          ) : (
            news.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  '&:last-child': { mb: 0 },
                }}
              >
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.title}
                  </Typography>
                </Link>
                <Typography variant="caption" color="text.secondary">
                  {item.source} • {new Date(item.publishedAt).toLocaleDateString()}
                </Typography>
              </Box>
            ))
          )}
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
          {currentTab === 2 && <TradingTab />}
          {currentTab === 3 && <HealthTab />}
        </Box>
      </Box>
    </Box>
  );
}
