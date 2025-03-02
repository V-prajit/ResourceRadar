import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Dropdown from './DropDown';
import CpuSystemGraph from './CPUGraph';
import MemUsageGraph from './MEMGraph';
import { io } from 'socket.io-client';

function SystemDetails(){
    const { name } = useParams();
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
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        
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
        fetch(`${apiUrl}/api/machine/${encodeURIComponent(name)}`)
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
        return <div>Loading...</div>;
    }

    return(
        <div>
            <h1>System Details</h1>
            <p>Host Name: {name}</p>
            <p>Host IP: {systemInfo.host}</p>
            <Dropdown timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
            <CpuSystemGraph timeFrame={timeFrame} graphData={graphData || []} />
            <MemUsageGraph timeFrame={timeFrame} graphData={graphData || []} />
        </div>
    );
};

export default SystemDetails;