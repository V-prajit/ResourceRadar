import React from "react";

const Dropdown = ({ timeFrame, onTimeFrameChange }) => {
    const handleChange = (event) => {
        const newTimeFrame = event.target.value;
        onTimeFrameChange(newTimeFrame);
};

    return (
        <div>
            <select value = {timeFrame} onChange={handleChange}>
                <option value = "one_minute">1 Minutes </option>
                <option value= "five_minutes"> 5 Minutes </option>
                <option value = "fifteen_minutes">15 Minutes </option>
                <option value = "one_hour">1 Hour </option>
                <option value= "three_hours"> 3 Hours </option>
                <option value = "six_hours">6 Hours </option>
                <option value= "twelve hours"> 12 Hours </option>
                <option value = "one_day">1 Day </option>
                <option value = "two_day">2 Day </option>
                <option value = "seven_day">7 Day </option>
                <option value = "thirty_day">30 Day </option>
            </select>
            <p>{timeFrame}</p>
        </div>
    );
};

export default Dropdown;