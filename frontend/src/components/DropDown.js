import React from "react";
import { 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Box
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const Dropdown = ({ timeFrame, onTimeFrameChange }) => {
    const handleChange = (event) => {
        const newTimeFrame = event.target.value;
        onTimeFrameChange(newTimeFrame);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ mr: 1 }} fontSize="small" />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="timeframe-select-label">Time Frame</InputLabel>
                <Select
                    labelId="timeframe-select-label"
                    id="timeframe-select"
                    value={timeFrame}
                    onChange={handleChange}
                    label="Time Frame"
                >
                    <MenuItem value="1m">1 Minute</MenuItem>
                    <MenuItem value="5m">5 Minutes</MenuItem>
                    <MenuItem value="15m">15 Minutes</MenuItem>
                    <MenuItem value="1h">1 Hour</MenuItem>
                    <MenuItem value="3h">3 Hours</MenuItem>
                    <MenuItem value="6h">6 Hours</MenuItem>
                    <MenuItem value="12h">12 Hours</MenuItem>
                    <MenuItem value="1d">1 Day</MenuItem>
                    <MenuItem value="2d">2 Days</MenuItem>
                    <MenuItem value="1w">7 Days</MenuItem>
                    <MenuItem value="30d">30 Days</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default Dropdown;