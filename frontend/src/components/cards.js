import React, { useState, useEffect } from 'react';

function SystemDashboard() {
    const [systems, setSystems] = useState([]);

    useEffect(() => {
        const fetchSystems= () => {
            fetch("http://localhost:3001/resourceusage")
            .then(response => response.json())
            .then(data => setSystems(data))
            .catch(error => console.error('Error', error));
        };

        fetchSystems(); 
        const intervalId = setInterval(fetchSystems, 100); 
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <h1>System Dashboard</h1>
            <div className="system-cards">
                {systems.map((system, index) => (
                    <SystemCard key={index} system={system} />
                ))}
            </div>
        </div>
    );
}

function SystemCard({ system }) {
    return (
        <div className="card">
            <h3>Host IP: {system.host}</h3>
            <p>CPU Usage: {system.cpuUsage}%</p>
            <p>MEM Usage: {system.memUsage}MB</p>
        </div>
    );
}

export default SystemDashboard;