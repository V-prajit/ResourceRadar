import React from "react";

const Dropdown = ({ timeFrame, onTimeFrameChange }) => {
    const handleChange = (event) => {
        const newTimeFrame = event.target.value;
        onTimeFrameChange(newTimeFrame);
};

    return (
        <div>
            <select value = {timeFrame} onChange={handleChange}>
                <option value = "1m">1 Minutes </option>
                <option value= "5m"> 5 Minutes </option>
                <option value = "15m">15 Minutes </option>
                <option value = "1h">1 Hour </option>
                <option value= "3h"> 3 Hours </option>
                <option value = "6h">6 Hours </option>
                <option value= "12h"> 12 Hours </option>
                <option value = "1d">1 Day </option>
                <option value = "2d">2 Day </option>
                <option value = "1w">7 Day </option>
                <option value = "30d">30 Day </option>
            </select>
            <p>{timeFrame}</p>
        </div>
    );
};

export default Dropdown;