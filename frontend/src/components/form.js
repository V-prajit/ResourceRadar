import { useState } from "react";
import { 
    Typography,
    Button,
    TextField,
    Box,
    Collapse,
    Card,
    CardContent,
    InputAdornment,
    IconButton,
    Grid,
    Alert,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ComputerIcon from '@mui/icons-material/Computer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function MachinesForm() {
    const [Machines, setMachines] = useState(false);
    const [Name, setName] = useState("");
    const [Host, setHost] = useState("");
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [Port, setPort] = useState("22");
    const [isOpen, setIsOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function GetMachine(){
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const apiUrl = `${protocol}//${hostname}${port}/api`;
        
        fetch(`${apiUrl}/`)
            .then(response => {
                return response.text();
            })
            .then(data => {
              setMachines(data);
            });
    }

    function NumberInput(e){
        const value = e.target.value.replace(/\D/g, "");
        setPort(value);
    }

    function CreateMachine(){
      setIsSubmitting(true);
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';
      const apiUrl = `${protocol}//${hostname}${port}/api`;
      
      fetch(`${apiUrl}/sshverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Name, Host, Username, Password, Port}),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(data => {
          console.log(data);
          GetMachine();
          resetForm();
        })
        .catch(error => {
          if (error.message.includes("already exists")) {
            alert("A machine with this name already exists. Please choose a different name.");
          } else {
            console.error('Error:', error);
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }

    function resetForm() {
        setIsOpen(false);
        setName("");
        setPassword("");
        setUsername("");
        setPort("22");
        setHost("");
    }

    function HandleSubmit(e) {
        e.preventDefault();
        CreateMachine();
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                    Add New Machine
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setIsOpen(!isOpen)}
                    color="primary"
                >
                    {isOpen ? 'Cancel' : 'Add Machine'}
                </Button>
            </Box>
            
            <Collapse in={isOpen}>
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <form onSubmit={HandleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ComputerIcon sx={{ mr: 1 }} />
                                        Machine Details
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Host Name"
                                        variant="outlined"
                                        value={Name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Host IP"
                                        variant="outlined"
                                        value={Host}
                                        onChange={(e) => setHost(e.target.value)}
                                        required
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        SSH Connection Details
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="SSH Username"
                                        variant="outlined"
                                        value={Username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
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
                                
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="SSH Port"
                                        variant="outlined"
                                        value={Port}
                                        onChange={NumberInput}
                                        helperText="Default is 22. Only change if necessary."
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            startIcon={<SaveIcon />}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Machine'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Collapse>
            
            {!isOpen && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Click the "Add Machine" button to monitor a new server.
                </Alert>
            )}
        </Box>
    );
}
export default MachinesForm;
