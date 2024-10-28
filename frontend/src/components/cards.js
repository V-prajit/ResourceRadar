import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

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

function SystemCard({system}) {

    const navigate = useNavigate();
    const handleCardClick = (e) => {
        navigate(`/details/${system.name}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation(); 
        console.log('Edit', system.name);
    };

    const handleDelete = (e) => {
        e.stopPropagation(); 
        const confirmDelete = window.confirm(`Are you sure you want to delete the system with the host IP: ${system.name}?`);
        if (confirmDelete) {
            fetch(`http://localhost:3001/api/machine/${encodeURIComponent(system.name)}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete the system');
                }
                return response.json();
            })
            .then(data => {
                console.log('Delete successful', data);
            })
            .catch(error => console.error('Error:', error));
        }
    };

    const isOffline = system.status === 'offline';

    return (
        <div className={`card ${isOffline ? 'offline' : ''}`} onClick={handleCardClick}>
            <h3>Host Name: {system.name}</h3>
            <p>Host IP: {system.host}</p>
            <p>Status: <span className={isOffline ? 'status-offline' : 'status-online'}>
                {system.status}
            </span></p>
            {!isOffline && (
                <>
                    <p>CPU Usage: {system.cpuUsage}%</p>
                    <p>MEM Usage: {system.memUsage}MB</p>
                </>
            )}
            <div style={{ textAlign: 'right' }}>
                <button onClick={handleEdit}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button onClick={handleDelete}>
                    <FontAwesomeIcon icon={faTrashAlt} /> Delete
                </button>
            </div>
        </div>
    );
}

export default SystemDashboard;