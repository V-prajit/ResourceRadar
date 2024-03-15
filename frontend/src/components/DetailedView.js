import React, { createContext, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Dropdown from './DropDown';
import SystemGraph from './Graph';

function SystemDetails(){
    const { host } = useParams();
    const [timeFrame, setTimeFrame] = useState('one_hour');

    const handleTimeFrameChange = (newTimeFrame) => {
        setTimeFrame(newTimeFrame);
    };

    return(
        <div>
            <p>The details of the system is {host}</p>
            <Dropdown timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
            <SystemGraph timeFrame = {timeFrame} />
        </div>
    );
};

export default SystemDetails;