import React, { useEffect, useState } from 'react';

const CpuUsageDisplay = () => {
  const [cpuUsage, setCpuUsage] = useState(0);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCpuUsage(data.cpuUsage);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>CPU Usage: {cpuUsage}%</h1>
    </div>
  );
};

export default CpuUsageDisplay;
