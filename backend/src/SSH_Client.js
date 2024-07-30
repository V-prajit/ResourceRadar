const { Pool } = require('pg');
const { Client } = require("ssh2");
require('dotenv').config();
const fetchCpuUsage = require('./system_stats/Cpu_stats');
const fetchMemoryUsage = require('./system_stats/Memory_stats');

const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const { DeleteAPI } = require('@influxdata/influxdb-client-apis');

const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeOptions = { flushInterval: 1000 };
const writeApi = client.getWriteApi(org, bucket, 'ns', writeOptions);
const queryApi = client.getQueryApi(org);

const backoff = (retries) => {
  return Math.min(1000*(2 ** retries), 60000);
}

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

const createsshClient = async (system, retries = 0) => {
    const sshClient = new Client();
    return new Promise((resolve, reject) => {
      sshClient.on("ready", async () => {
        try {
            await Promise.all([
                fetchCpuUsage(sshClient, system, writeApi),
                fetchMemoryUsage(sshClient, system, writeApi)
            ]);
            sshClient.end();
            resolve();// Close the SSH connection
        } catch (error) {
            console.error('Error:', error);
            reject(error);
        }
    })
    .on('error', (err) => {
      console.error(`SSH Client Error for ${system.name}:`, err);
    sshClient.end();

    if (retries < 5) {
      const delay = backoff(retries);
      console.log(`Retrying connection to ${system.name} in ${delay}ms...`);
      setTimeout(() => {
        createsshClient(system, retries + 1)
          .then(resolve)
          .catch(reject);
      }, delay);
    } else {
      console.error(`Max retries reached for ${system.name}`);
      reject(err);
    }
    })
    .connect({
        host: system.host,
        port: system.port || 22, // Default to port 22 if not specified
        username: system.username,
        password: system.password

    })
       });
};



const monitorAllSystems = async () => {
    const systems = await getSystemsData();
    const promises = systems.map(system => createsshClient(system).catch(err => {
        console.error(`Failed to monitor ${system.name}:`, err);
        return null; // Return null for failed systems
    }))
    await Promise.all(promises);
};

const SendResources = async () => {
    const systems = await getSystemsData();
    const resourceData = await Promise.all(systems.map(async (system) => {
        try {
            return {
                name: system.name,
                host: system.host,
                cpuUsage: await CPUResourceUsage(system),
                memUsage: await MEMORYResourceUsage(system),
                status: 'online'
            };
        } catch (error) {
            console.error(`Error fetching resources for ${system.name}:`, error);
            return{
                name: system.name,
                host: system.name,
                cpuUsage: null,
                memUsage: null,
                status: 'offline'
            };
        }

    }));
    return resourceData;
};

const CPUResourceUsage = (system) => {
    const FluxQuery = `
    from(bucket: "Server_Stats")
      |> range(start: -1m)
      |> filter(fn: (r) => r["_measurement"] == "cpu_usage")
      |> filter(fn: (r) => r["_field"] == "usage")
      |> filter(fn: (r) => r["name"] == "${system.name}")
      |> last()
    `;

    return new Promise((resolve, reject) => {
        let hasData = false;
        queryApi.queryRows(FluxQuery, {
            next (row, tableMeta){
                const o = tableMeta.toObject(row);
                hasData = true;
                resolve(o._value);
            },
            error(error) {
                console.log(error);
                reject(error);
            },
            complete(){
                if (!hasData){
                    reject(new Error('No CPU usage data available'));
                }
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
      |> filter(fn: (r) => r["name"] == "${system.name}")
      |> last()
    `;

    return new Promise((resolve, reject) => {
        let hasData = false;
        queryApi.queryRows(FluxQuery, {
            next (row, tableMeta){
                const o = tableMeta.toObject(row);
                hasData = true;
                resolve(o._value);
            },
            error(error) {
                console.log(error);
                reject(error);
            },
            complete(){
                if(!hasData){
                    reject(new Error('No memory usage data available'));
                }
            }
        })
    });
};

const deleteInfluxData = async (name) => {
    const deleteAPI = new DeleteAPI(client);
    const start = '1970-01-01T00:00:00Z';
    const stop = new Date().toISOString();
    const predicate = `name="${name}"`;
    try {
        await deleteAPI.postDelete({
          org,
          bucket,
          body: {
            start,
            stop,
            predicate,
          },
        });
        console.log(`Deleted InfluxDB data for host: ${name}`);
    
        // Additional step to remove lingering tags
        const fluxQuery = `
          from(bucket:"${bucket}")
            |> range(start: 0)
            |> filter(fn: (r) => r.name == "${name}")
            |> drop()
        `;
        const queryApi = client.getQueryApi(org);
        await queryApi.query(fluxQuery);
        console.log(`Removed lingering tags for host: ${name}`);
      } catch (error) {
        console.error(`Error deleting InfluxDB data for host ${name}`, error);
        throw error;
      }
}


module.exports = { monitorAllSystems, SendResources, deleteInfluxData };
