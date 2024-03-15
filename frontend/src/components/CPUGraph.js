import React from "react";
import { Line } from "react-chartjs-2";
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const CpuUsageGraph = ({ timeFrame, graphData }) => {
    const cpuData = graphData.filter(data => data._measurement === 'cpu_usage');

    const dataset = {
        label: `CPU Usage`,
        data: cpuData.map(data => ({ x: new Date(data._time), y: data._value })),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
    };

    const config = {
        data: {
            datasets: [dataset]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            minute: 'h:mm a'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CPU Usage'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                }
            }
        }
    };

    return (
        <div>
            <p> CPU Usage over {timeFrame}</p>
            <div>
                <Line {...config} />
            </div>
        </div>
    );
};

export default CpuUsageGraph;
