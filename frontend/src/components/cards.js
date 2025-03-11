import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditForm from './EditForm';
import { io } from 'socket.io-client';
import { 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CardActions, 
    Button, 
    Chip,
    LinearProgress,
    Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';

function SystemDashboard() {
    const [systems, setSystems] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}`;
        
        const setupSocketConnection = () => {
            console.log("Initializing Socket.IO connection...");
            
            const socket = io({
              path: '/socket.io',
              transports: ['websocket', 'polling'],
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 20000
            });
            
            socket.on('connect', () => {
              console.log('Socket.IO connected successfully!', socket.id);
            });
            
            socket.on('connect_error', (error) => {
              console.error('Socket.IO connection error:', error.message);
            });
            
            socket.on('disconnect', (reason) => {
              console.log('Socket.IO disconnected:', reason);
            });
            
            return socket;
        };
          
        const newSocket = setupSocketConnection();
        setSocket(newSocket);

        // Listen for resource data updates
        newSocket.on('resourceData', (data) => {
            setSystems(data);
        });

        // Clean up on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                System Dashboard
            </Typography>
            <Grid container spacing={3}>
                {systems.map((system, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <SystemCard system={system} onUpdate={() => setSystems([])} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

function SystemCard({system, onUpdate}) {
    const [showEditForm, setShowEditForm] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);

    const navigate = useNavigate();
    const handleCardClick = () => {
        navigate(`/details/${system.name}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation(); 
        
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}/api`;
        
        fetch(`${apiUrl}/`)
        .then(response => response.json())
        .then(data => {
            const machineInfo = data.find(machine => machine.name === system.name);
            if (machineInfo) {
                setSystemInfo(machineInfo);
                setShowEditForm(true);
            } else {
                console.error('Machine info not found');
            }
        })
        .catch(error => console.error('Error:', error));
    };

    const handleDelete = (e) => {
        e.stopPropagation(); 
        const confirmDelete = window.confirm(`Are you sure you want to delete the system with the host IP: ${system.name}?`);
        if (confirmDelete) {
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            const apiUrl = `${protocol}//${hostname}${port}/api`;
            
            fetch(`${apiUrl}/machine/${encodeURIComponent(system.name)}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete the system');
                }
                return response.json();
            })
            .then(data => {
                console.log('Delete successful', data);
                if (onUpdate) onUpdate();
            })
            .catch(error => console.error('Error:', error));
        }
    };

    const isOffline = system.status === 'offline';
    
    // Calculate CPU usage for progress bar
    const cpuUsage = parseInt(system.cpuUsage) || 0;
    const memUsage = parseInt(system.memUsage) || 0;
    
    // Determine status color
    const statusColor = isOffline ? 'error' : 'success';

    return (
        <>
            <Card 
                sx={(theme) => ({ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    bgcolor: theme.palette.mode === 'dark' 
                        ? (isOffline ? 'rgba(244, 67, 54, 0.15)' : theme.palette.background.paper) 
                        : (isOffline ? '#fef7f7' : 'white'),
                    color: theme.palette.text.primary,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                    }
                })}
                onClick={handleCardClick}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ComputerIcon sx={{ mr: 1 }} />
                        <Typography variant="h6" component="h2" gutterBottom>
                            {system.name}
                        </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Host IP: {system.host}
                    </Typography>
                    
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Chip 
                            label={`Status: ${system.status}`} 
                            color={statusColor} 
                            size="small"
                            sx={{ fontWeight: 'medium' }}
                        />
                    </Box>
                    
                    {!isOffline && system.initialCollection ? (
                        <Typography variant="body2">Collecting metrics - please wait...</Typography>
                    ) : !isOffline && (
                        <>
                            <Box sx={{ mt: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <MemoryIcon fontSize="small" sx={{ mr: 1 }} />
                                    <Typography variant="body2">CPU Usage: {cpuUsage}%</Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={cpuUsage} 
                                    color={cpuUsage > 80 ? 'error' : cpuUsage > 50 ? 'warning' : 'primary'}
                                    sx={{ height: 8, borderRadius: 5, mb: 2 }}
                                />
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <MemoryIcon fontSize="small" sx={{ mr: 1 }} />
                                    <Typography variant="body2">Memory Usage: {memUsage} MB</Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(memUsage / 10, 100)} 
                                    color={memUsage > 8000 ? 'error' : memUsage > 4000 ? 'warning' : 'primary'}
                                    sx={{ height: 8, borderRadius: 5 }}
                                />
                            </Box>
                        </>
                    )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button 
                        size="small" 
                        startIcon={<EditIcon />} 
                        onClick={handleEdit}
                        color="primary"
                    >
                        Edit
                    </Button>
                    <Button 
                        size="small" 
                        startIcon={<DeleteIcon />} 
                        onClick={handleDelete}
                        color="error"
                    >
                        Delete
                    </Button>
                </CardActions>
            </Card>
            
            {showEditForm && systemInfo && (
                <EditForm 
                    system={systemInfo} 
                    onClose={() => setShowEditForm(false)} 
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}

export default SystemDashboard;