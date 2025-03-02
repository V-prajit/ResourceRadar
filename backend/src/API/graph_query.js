require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');

// Load environment variables
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

// Initialize InfluxDB client - use influxdb host name for Docker networking
const influxUrl = process.env.INFLUXDB_URL || 'http://influxdb:8086/';
console.log(`Graph query using InfluxDB URL: ${influxUrl}`);
const client = new InfluxDB({ url: influxUrl, token: token });
const queryApi = client.getQueryApi(org);

const SendGraphData = async (name, timeFrame) => {

    const getWindowSize = (timeFrame) => {
        if(timeFrame.includes("1m")){
            return '1s'; 
        } else if(timeFrame.includes("5m")){
            return '5s'; 
        } else if(timeFrame.includes("15m")){
            return '15s'; 
        } else if(timeFrame.includes("1h")){
            return '2m'; 
        } else if(timeFrame.includes("3h")){
            return '6m'; 
        } else if(timeFrame.includes("6h")){
            return '12m'; 
        } else if(timeFrame.includes("12h")){
            return '24m'; 
        } else if(timeFrame.includes("1d")){
            return '1h'; 
        } else if(timeFrame.includes("2d")){
            return '2h'; 
        } else if(timeFrame.includes("7d")){
            return '6h'; 
        } else if(timeFrame.includes("30d")){
            return '12h'; 
        } else {
            return '1d'; 
        }
    };
    

    const windowSize = getWindowSize(timeFrame);

    const fluxQuery = `from(bucket: "${bucket}")
        |> range(start: -${timeFrame})
        |> filter(fn: (r) => r.name == "${name}")
        |> aggregateWindow(every: ${windowSize}, fn: mean, createEmpty: false)`;
    
    console.log(`Running query for ${name} with timeframe ${timeFrame}: ${fluxQuery}`);

    // Wrap the query operation in a Promise
    return new Promise((resolve, reject) => {
        const results = [];
        queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                results.push(o);
            },
            error(error) {
                console.error('Error querying data:', error);
                reject(new Error('Error querying data')); 
            },
            complete() {
                console.log('Query completed');
                resolve(results); 
            },
        });
    });
};

module.exports = SendGraphData;
