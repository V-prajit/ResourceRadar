import { useState, useEffect, useContext } from 'react';
import MachinesForm from './form';
import SystemDashboard from './cards';
import { ColorModeContext } from '../App';
import { 
    Container, 
    Box, 
    AppBar, 
    Toolbar, 
    Typography, 
    Paper, 
    IconButton, 
    Button,
    Drawer,
    useMediaQuery,
    useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AddIcon from '@mui/icons-material/Add';

function HomePage(){
    const colorMode = useContext(ColorModeContext);
    const theme = useTheme();
    const [systems, setSystems] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    
    useEffect(() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}/api`;
        
        console.log("Connecting to API at:", apiUrl);
        
        // Add retry logic for API connection
        const fetchWithRetry = (url, retries = 3, delay = 2000) => {
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API responded with status ${response.status}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    if (retries > 0) {
                        console.log(`Retrying API connection in ${delay}ms... (${retries} attempts left)`);
                        return new Promise(resolve => setTimeout(resolve, delay))
                            .then(() => fetchWithRetry(url, retries - 1, delay));
                    }
                    throw error;
                });
        };
        
        fetchWithRetry(`${apiUrl}/`)
            .then(data => {
                console.log("Systems data loaded:", data);
                setSystems(data);
            })
            .catch(error => console.error('Error fetching systems after retries:', error));
    }, []);
    
    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <DashboardIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Resource Radar
                    </Typography>
                    
                    {/* Show Add Machine button in toolbar if systems exist */}
                    {systems.length > 0 && (
                        <Button 
                            color="inherit" 
                            startIcon={<AddIcon />}
                            onClick={toggleDrawer}
                            sx={{ mr: 2 }}
                        >
                            Add Machine
                        </Button>
                    )}
                    
                    {/* Theme toggle button */}
                    <IconButton 
                        sx={{ ml: 1 }} 
                        onClick={colorMode.toggleColorMode} 
                        color="inherit"
                        aria-label="toggle light/dark mode"
                    >
                        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <SystemDashboard />
                </Paper>
                
                {/* Show MachinesForm directly if no systems exist */}
                {systems.length === 0 ? (
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <MachinesForm onAdd={() => setSystems([...systems, {}])} />
                    </Paper>
                ) : (
                    // Otherwise use drawer for Add Machine form
                    <Drawer
                        anchor="right"
                        open={drawerOpen}
                        onClose={toggleDrawer}
                        sx={{
                            width: isDesktop ? 400 : '100%',
                            flexShrink: 0,
                            '& .MuiDrawer-paper': {
                                width: isDesktop ? 400 : '100%',
                                boxSizing: 'border-box',
                                p: 2
                            },
                        }}
                    >
                        <MachinesForm onAdd={() => setSystems([...systems, {}])} />
                    </Drawer>
                )}
            </Container>
        </>
    );
}

export default HomePage;