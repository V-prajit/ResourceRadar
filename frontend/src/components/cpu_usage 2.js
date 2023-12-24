import React, { useEffect, useState } from 'react';
import '../css/SystemUsageDisplay.css'; // Import the CSS file
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const SystemUsageDisplay = () => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  const initialDataPoints = Array(60).fill(0);
  const initialTimestamps = Array(60).fill('').map((_, i) => new Date(Date.now() - (60 - i) * 1000).toLocaleTimeString());

  const [cpuData, setCpuData] = useState({
    labels: initialTimestamps,
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: initialDataPoints,
        fill: true,
        backgroundColor: '#21a0fa',
        borderColor: 'rgba(255, 99, 132, 0.2)',
      }
    ],
  });
  const [memoryData, setMemoryData] = useState({
    labels: initialTimestamps,
    datasets: [
      {
        label: 'Memory Usage (MB)',
        data: initialDataPoints,
        fill: true,
        backgroundColor: '#21a0fa',
        borderColor: 'rgba(54, 162, 235, 0.2)',
      }
    ],
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCpuUsage(data.cpuUsage);
      setMemoryUsage(data.memoryUsage);

      const newTime = new Date().toLocaleTimeString();
      const newCpuData = [...cpuData.datasets[0].data, data.cpuUsage];
      const newMemData = [...memoryData.datasets[0].data, data.memoryUsage];
      const newLabels = [...cpuData.labels, newTime];

      
      if (newLabels.length > 60) {
        newLabels.shift();
        newCpuData.shift();
        newMemData.shift();
      }

      setCpuData({
        labels: newLabels,
        datasets: [{ ...cpuData.datasets[0], data: newCpuData }]
      });

      setMemoryData({
        labels: newLabels,
        datasets: [{ ...memoryData.datasets[0], data: newMemData }]
      });
    };

    return () => {
      ws.close();
    };
  }, [cpuData, memoryData]);

  const cpuOptions = {
    scales: {
      y: {
        title: {
          display: true,
          text: 'CPU Usage (%)'
        },
        min:0,
        max:100,
      }
    }
  };

  return (
    <div className="usage-container">
      <div className="usage-block">
        <h1>Current CPU Usage: <span className="usage-number">{cpuUsage}%</span></h1>
        <div className="chart-container">
          <Line data={cpuData} options={cpuOptions} />
        </div>
      </div>
      <div className="usage-block">
        <h1>Current Memory Usage: <span className="usage-number">{memoryUsage}MB</span></h1>
        <div className="chart-container">
          <Line data={memoryData} />
        </div>
      </div>
    </div>
  );
};

export default SystemUsageDisplay;
