import React, { createContext, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Dropdown from './DropDown';
import CpuSystemGraph from './CPUGraph';
import MemUsageGraph from './MEMGraph';

function SystemDetails(){
    const { name } = useParams();
    const [timeFrame, setTimeFrame] = useState('1h');
    const [graphData, setGraphData] = useState(null)
    const [systemInfo, setSystemInfo] = useState(null);

    const handleTimeFrameChange = (newTimeFrame) => {
        setTimeFrame(newTimeFrame);
    };

    const fetchData = () => {
        fetch('http://localhost:3001/api/data/graph', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({
                name,
                timeFrame,
            }),
        })
        .then(response => response.json())
        .then(data=> {
            setGraphData(data);
        })
        .catch(error => console.error('Error Fetching Graph Data:', error));
    };

    useEffect(() => {
        fetchData();
        // Fetch system info
        fetch(`http://localhost:3001/api/machine/${encodeURIComponent(name)}`)
            .then(response => response.json())
            .then(data => setSystemInfo(data))
            .catch(error => console.error('Error fetching system info:', error));
    }, [name, timeFrame]);

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