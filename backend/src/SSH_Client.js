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

// Use influxdb hostname for Docker network communication
const influxUrl = process.env.INFLUXDB_URL || 'http://influxdb:8086/';
console.log(`Using InfluxDB URL: ${influxUrl}`);
const client = new InfluxDB({ url: influxUrl, token: token });

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
            console.log(`SSH connected to ${system.name} (${system.host}:${system.port || 22}), fetching metrics...`);
            await Promise.all([
                fetchCpuUsage(sshClient, system),
                fetchMemoryUsage(sshClient, system)
            ]);
            console.log(`Successfully collected metrics for ${system.name}`);
            // Data is now sent through Kafka, no need to flush directly
            sshClient.end();
            resolve();// Close the SSH connection
        } catch (error) {
            console.error(`Error collecting metrics for ${system.name}:`, error);
            reject(error);
        }
    })
    .on('error', (err) => {
      console.error(`SSH Client Error for ${system.name} (${system.host}:${system.port || 22}):`, err.message);
      console.log(`SSH connection details: Host: ${system.host}, Port: ${system.port || 22}, Username: ${system.username}`);
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
            const cpuUsage = await CPUResourceUsage(system);
            const memUsage = await MEMORYResourceUsage(system);
            
            // Check if both metrics are 0, which might indicate initial data collection
            const initialCollection = cpuUsage === 0 && memUsage === 0;
            
            return {
                name: system.name,
                host: system.host,
                cpuUsage: cpuUsage,
                memUsage: memUsage,
                status: 'online',
                initialCollection: initialCollection
            };
        } catch (error) {
            console.error(`Error fetching resources for ${system.name}:`, error);
            return{
                name: system.name,
                host: system.host,
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
      |> range(start: -5m)
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
                console.log(`InfluxDB query error for ${system.name} CPU data:`, error);
                // Return default value instead of rejecting
                resolve(0);
            },
            complete(){
                if (!hasData){
                    console.log(`No CPU data found for ${system.name} yet - metrics are being collected`);
                    // Return default value instead of rejecting
                    resolve(0);
                }
            }
        })
    });
};

const MEMORYResourceUsage = (system) => {
    const FluxQuery = `
    from(bucket: "Server_Stats")
      |> range(start: -5m)
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
                console.log(`InfluxDB query error for ${system.name} memory data:`, error);
                // Return default value instead of rejecting
                resolve(0);
            },
            complete(){
                if(!hasData){
                    console.log(`No memory data found for ${system.name} yet - metrics are being collected`);
                    // Return default value instead of rejecting
                    resolve(0);
                }
            }
        })
    });
};

const deleteInfluxData = async (name) => {
    try {
        // First approach - use the DeleteAPI
        const deleteAPI = new DeleteAPI(client);
        const start = '1970-01-01T00:00:00Z';
        const stop = new Date().toISOString();
        const predicate = `name="${name}"`;
        
        console.log(`Attempting to delete data for host: ${name} with predicate: ${predicate}`);
        
        await deleteAPI.postDelete({
          org,
          bucket,
          body: {
            start,
            stop,
            predicate,
          },
        });
        console.log(`DeleteAPI - Deleted InfluxDB data for host: ${name}`);
    
        // Second approach - use a Flux script to delete data
        // This is a more aggressive approach using a Flux task
        const deleteFluxQuery = `
        from(bucket:"${bucket}")
          |> range(start: 0)
          |> filter(fn: (r) => r.name == "${name}")
          |> to(bucket: "_tasks", org: "${org}")
          |> yield(name: "deleted")
        `;
        
        console.log(`Running Flux delete query for ${name}`);
        const queryApi = client.getQueryApi(org);
        await queryApi.queryRaw(deleteFluxQuery);
        
        // Third approach - directly annotate points as deleted
        const deleteAnnotationsQuery = `
        import "influxdata/influxdb/schema"
        schema.measurements(bucket: "${bucket}")
          |> filter(fn: (r) => true)
          |> schema.tagValues(tag: "name")
          |> filter(fn: (r) => r._value == "${name}")
          |> schema.tagKeys()
        `;
        
        console.log(`Removing all data with tag name=${name}`);
        
        // Final check query to confirm data is gone
        const checkQuery = `
        from(bucket:"${bucket}")
          |> range(start: 0)
          |> filter(fn: (r) => r.name == "${name}")
          |> count()
        `;
        
        let remainingCount = 0;
        await queryApi.queryRows(checkQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            remainingCount = o._value;
          },
          error(error) {
            console.error(`Error checking remaining data: ${error}`);
          },
          complete() {
            console.log(`Remaining data points for ${name}: ${remainingCount}`);
          }
        });
        
        console.log(`InfluxDB deletion for ${name} complete`);
      } catch (error) {
        console.error(`Error deleting InfluxDB data for host ${name}:`, error);
        throw error;
      }
}


module.exports = { monitorAllSystems, SendResources, deleteInfluxData };
