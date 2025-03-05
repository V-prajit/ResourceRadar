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
    
    // Fetch systems to check if any exist
    useEffect(() => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        console.log("Connecting to API at:", apiUrl);
        fetch(`${apiUrl}/`)
            .then(response => response.json())
            .then(data => {
                console.log("Systems data loaded:", data);
                setSystems(data);
            })
            .catch(error => console.error('Error fetching systems:', error));
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