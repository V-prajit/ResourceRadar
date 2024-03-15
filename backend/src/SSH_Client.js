const { Pool } = require('pg');
const { Client } = require("ssh2");
require('dotenv').config();
const fetchCpuUsage = require('./system_stats/Cpu_stats');
const fetchMemoryUsage = require('./system_stats/Memory_stats');

const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeOptions = { flushInterval: 1000 };
const writeApi = client.getWriteApi(org, bucket, 'ns', writeOptions);
const queryApi = client.getQueryApi(org);

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

const getSystemsData = async () => {
    const query = 'SELECT * FROM machines';
    try {
        const res = await pool.query(query);
        return res.rows;
    } catch (err){
        console.error(err);
        return [];
    }
};
const createsshClient = async (system) => {
    const sshClient = new Client();
    sshClient.on("ready", async () => {
        try {
            await Promise.all([
                fetchCpuUsage(sshClient, system, writeApi),
                fetchMemoryUsage(sshClient, system, writeApi)
            ]);
            sshClient.end(); // Close the SSH connection
        } catch (error) {
            console.error('Error:', error);
        }
    })
    .on('error', (err) => {
        console.error('SSH Client Error:', err);
    })
    .connect({
        host: system.host,
        port: system.port || 22, // Default to port 22 if not specified
        username: system.username,
        password: system.password
        });
};



const monitorAllSystems = async () => {
    const systems = await getSystemsData(); // Retrieve systems from the database
    systems.forEach(system => {
        createsshClient(system);
    });
};

const SendResources = async () => {
    const systems = await getSystemsData();
    const resourceData = await Promise.all(systems.map(async (system) => {
        return {
            host: system.host,
            cpuUsage: await CPUResourceUsage(system),
            memUsage: await MEMORYResourceUsage(system)
        };
    }));
    return resourceData;
};

const CPUResourceUsage = (system) => {
    const FluxQuery = `
    from(bucket: "Server_Stats")
      |> range(start: -1m)
      |> filter(fn: (r) => r["_measurement"] == "cpu_usage")
      |> filter(fn: (r) => r["_field"] == "usage")
      |> filter(fn: (r) => r["host"] == "${system.host}")
      |> last()
    `;

    return new Promise((resolve, reject) => {
        queryApi.queryRows(FluxQuery, {
            next (row, tableMeta){
                const o = tableMeta.toObject(row);
                resolve(o._value);
            },
            error(error) {
                console.log(error);
                reject(error);
            },
            complete(){
            }
        })
    });
};

const MEMORYResourceUsage = (system) => {
    const FluxQuery = `
    from(bucket: "Server_Stats")
      |> range(start: -1m)
      |> filter(fn: (r) => r["_measurement"] == "memory_usage")
      |> filter(fn: (r) => r["_field"] == "usage")
      |> filter(fn: (r) => r["host"] == "${system.host}")
      |> last()
    `;

    return new Promise((resolve, reject) => {
        queryApi.queryRows(FluxQuery, {
            next (row, tableMeta){
                const o = tableMeta.toObject(row);
                resolve(o._value);
            },
            error(error) {
                console.log(error);
                reject(error);
            },
            complete(){
            }
        })
    });
};


module.exports = { monitorAllSystems, SendResources };