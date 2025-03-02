import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import EditForm from './EditForm';

function SystemDashboard() {
    const [systems, setSystems] = useState([]);

    useEffect(() => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const fetchSystems= () => {
            fetch(`${apiUrl}/resourceusage`)
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
                    <SystemCard key={index} system={system} onUpdate={() => setSystems([])} />
                ))}
            </div>
        </div>
    );
}

function SystemCard({system, onUpdate}) {
    const [showEditForm, setShowEditForm] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);

    const navigate = useNavigate();
    const handleCardClick = (e) => {
        navigate(`/details/${system.name}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation(); 
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        fetch(`${apiUrl}/`)
        .then(response => response.json())
        .then(data => {
            const machineInfo = data.find(machine => machine.name === system.name);
            if (machineInfo) {
                setSystemInfo(machineInfo);
                setShowEditForm(true);
            } else {
                console.error('Machine info not found');
            }
        })
        .catch(error => console.error('Error:', error));
    };

    const handleDelete = (e) => {
        e.stopPropagation(); 
        const confirmDelete = window.confirm(`Are you sure you want to delete the system with the host IP: ${system.name}?`);
        if (confirmDelete) {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            fetch(`${apiUrl}/api/machine/${encodeURIComponent(system.name)}`, {
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
                if (onUpdate) onUpdate();
            })
            .catch(error => console.error('Error:', error));
        }
    };

    const isOffline = system.status === 'offline';

    return (
        <>
            <div className={`card ${isOffline ? 'offline' : ''}`} onClick={handleCardClick}>
                <h3>Host Name: {system.name}</h3>
                <p>Host IP: {system.host}</p>
                <p>Status: <span className={isOffline ? 'status-offline' : 'status-online'}>
                    {system.status}
                </span></p>
                {!isOffline && system.initialCollection ? (
                    <p>Collecting metrics - please wait...</p>
                ) : !isOffline && (
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
            
            {showEditForm && systemInfo && (
                <EditForm 
                    system={systemInfo} 
                    onClose={() => setShowEditForm(false)} 
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}

export default SystemDashboard;