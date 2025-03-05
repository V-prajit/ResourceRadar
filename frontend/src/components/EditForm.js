import { useState } from "react";
import {
    Typography,
    TextField,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    IconButton,
    InputAdornment,
    Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ComputerIcon from '@mui/icons-material/Computer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function EditForm({ system, onClose, onUpdate }) {
    const [Host, setHost] = useState(system.host);
    const [Username, setUsername] = useState(system.username);
    const [Password, setPassword] = useState(system.password);
    const [Port, setPort] = useState(system.port || "22");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function NumberInput(e) {
        const value = e.target.value.replace(/\D/g, "");
        setPort(value);
    }

    function UpdateMachine() {
        setIsSubmitting(true);
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}/api`;
        
        fetch(`${apiUrl}/machine/${encodeURIComponent(system.name)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Host, Username, Password, Port }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Update successful:', data);
                if (onUpdate) {
                    onUpdate();
                }
                onClose();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to update machine. Please check SSH credentials and try again.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    function HandleSubmit(e) {
        e.preventDefault();
        UpdateMachine();
    }

    return (
        <Dialog 
            open={true} 
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ComputerIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Edit {system.name}</Typography>
                </Box>
                <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <form onSubmit={HandleSubmit}>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Host IP"
                                variant="outlined"
                                value={Host}
                                onChange={(e) => setHost(e.target.value)}
                                required
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="SSH Port"
                                variant="outlined"
                                value={Port}
                                onChange={NumberInput}
                                margin="normal"
                                helperText="Default is 22"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="SSH Username"
                                variant="outlined"
                                value={Username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                margin="normal"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="SSH Password"
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                value={Password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                margin="normal"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={onClose} 
                        variant="outlined"
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default EditForm;