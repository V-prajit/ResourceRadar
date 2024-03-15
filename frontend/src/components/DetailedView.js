import React, { createContext, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Dropdown from './DropDown';
import CpuSystemGraph from './CPUGraph';
import MemUsageGraph from './MEMGraph';

function SystemDetails(){
    const { host } = useParams();
    const [timeFrame, setTimeFrame] = useState('1h');
    const [graphData, setGraphData] = useState(null)

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
                host,
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
    }, [host, timeFrame]);

    return(
        <div>
            <p>The details of the system is {host}</p>
            <Dropdown timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
            <CpuSystemGraph timeFrame = {timeFrame} graphData={graphData || []} />
            <MemUsageGraph timeFrame = {timeFrame} graphData={graphData || []} />
        </div>
    );
};

export default SystemDetails;