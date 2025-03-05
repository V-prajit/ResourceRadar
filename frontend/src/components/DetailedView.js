import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Dropdown from './DropDown';
import CpuSystemGraph from './CPUGraph';
import MemUsageGraph from './MEMGraph';
import { io } from 'socket.io-client';
import { ColorModeContext } from '../App';
import { 
    Container, 
    Typography, 
    Paper, 
    Box, 
    Grid, 
    Button, 
    AppBar, 
    Toolbar, 
    IconButton,
    Chip,
    CircularProgress,
    useMediaQuery,
    useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ComputerIcon from '@mui/icons-material/Computer';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function SystemDetails(){
    const { name } = useParams();
    const navigate = useNavigate();
    const colorMode = useContext(ColorModeContext);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    
    const [timeFrame, setTimeFrame] = useState('1h');
    const [graphData, setGraphData] = useState(null);
    const [systemInfo, setSystemInfo] = useState(null);
    const [socket, setSocket] = useState(null);
    const refreshIntervalRef = useRef(null);

    // Determine refresh interval based on time frame
    const getRefreshInterval = (timeFrame) => {
        switch(timeFrame) {
            case '1m': return 500;     // 0.5 second for 1 minute view
            case '5m': return 2000;    // 2 seconds for 5 minute view
            case '15m': return 5000;   // 5 seconds for 15 minute view
            case '1h': return 10000;   // 10 seconds for 1 hour view
            case '3h': return 20000;   // 20 seconds for 3 hour view
            case '6h': return 30000;   // 30 seconds for 6 hour view
            case '12h': return 60000;  // 1 minute for 12 hour view
            case '1d': return 120000;  // 2 minutes for 1 day view
            case '2d': return 300000;  // 5 minutes for 2 day view
            case '7d': return 600000;  // 10 minutes for 7 day view
            case '30d': return 1800000;// 30 minutes for 30 day view
            default: return 10000;     // Default to 10 seconds
        }
    };

    const handleTimeFrameChange = (newTimeFrame) => {
        setTimeFrame(newTimeFrame);
    };

    // Function to request updated graph data
    const fetchGraphData = (socket) => {
        if (socket && socket.connected) {
            socket.emit('getGraphData', { host: name, timeFrame });
        }
    };

    useEffect(() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}/api`;
        
        // Create socket connection
        const newSocket = io(apiUrl);
        setSocket(newSocket);
        
        // Set up initial connection
        newSocket.on('connect', () => {
            console.log('Socket connected');
            fetchGraphData(newSocket);
        });
        
        // Listen for graph data updates
        newSocket.on('graphData', (data) => {
            console.log(`Received graph data with ${data.length} points`);
            setGraphData(data);
        });
        
        // Listen for resource data updates to get system info
        newSocket.on('resourceData', (data) => {
            const currentSystem = data.find(system => system.name === name);
            if (currentSystem) {
                setSystemInfo(currentSystem);
            }
        });
        
        // Fetch system info initially (for IP address and other details)
        fetch(`${apiUrl}/machine/${encodeURIComponent(name)}`)
            .then(response => response.json())
            .then(data => setSystemInfo(data))
            .catch(error => console.error('Error fetching system info:', error));
        
        // Clean up on component unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            newSocket.disconnect();
        };
    }, [name]); // Only recreate socket when name changes
    
    // Set up dynamic refresh interval when timeFrame changes
    useEffect(() => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
        
        // Request data immediately on timeFrame change
        if (socket) {
            fetchGraphData(socket);
        }
        
        // Set up new interval based on timeFrame
        const interval = getRefreshInterval(timeFrame);
        console.log(`Setting refresh interval to ${interval}ms for ${timeFrame} view`);
        
        refreshIntervalRef.current = setInterval(() => {
            if (socket) {
                fetchGraphData(socket);
            }
        }, interval);
        
        // Clean up interval on unmount or timeFrame change
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [timeFrame, socket]);

    if (!systemInfo) {
        return (
            <>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton 
                            edge="start" 
                            color="inherit" 
                            onClick={() => navigate('/')} 
                            sx={{ mr: 2 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <DashboardIcon sx={{ mr: 2 }} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Resource Radar
                        </Typography>
                        <IconButton 
                            sx={{ ml: 1 }} 
                            onClick={colorMode.toggleColorMode} 
                            color="inherit"
                        >
                            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>Loading system data...</Typography>
                </Container>
            </>
        );
    }

    return(
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        onClick={() => navigate('/')} 
                        sx={{ mr: 2 }}
                        aria-label="back to dashboard"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <DashboardIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Resource Radar
                    </Typography>
                    <IconButton 
                        sx={{ ml: 1 }} 
                        onClick={colorMode.toggleColorMode} 
                        color="inherit"
                    >
                        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ComputerIcon sx={{ mr: 1, fontSize: 30 }} />
                        <Typography variant="h4" component="h1">
                            {name}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                            Host IP: {systemInfo.host}
                        </Typography>
                        
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                            <Chip 
                                label={`Status: ${systemInfo.status}`} 
                                color={systemInfo.status === 'offline' ? 'error' : 'success'} 
                                size="small"
                                sx={{ mr: 2 }}
                            />
                            <Dropdown timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
                        </Box>
                    </Box>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={isDesktop ? 6 : 12}>
                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                                <CpuSystemGraph timeFrame={timeFrame} graphData={graphData || []} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={isDesktop ? 6 : 12}>
                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'background.paper' }}>
                                <MemUsageGraph timeFrame={timeFrame} graphData={graphData || []} />
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </>
    );
};

export default SystemDetails;