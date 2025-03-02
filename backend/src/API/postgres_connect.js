require('dotenv').config();

const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const getMachines = async () => {
  try {
    return await new Promise(function (resolve, reject) {
      pool.query("SELECT * FROM machines", (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(results.rows);
        } else {
          reject(new Error("No results found"));
        }
      });
    });
  } catch (error_1) {
    console.error(error_1);
    throw new Error("Internal server error");
  }
};

const createMachine = (body) => {
  return new Promise(function (resolve, reject) {
    const { Name, Host, Username, Password, Port} = body;
    pool.query(
      "INSERT INTO machines (name, host, username, password, port) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [Name, Host, Username, Password, Port],
      (error, results) => {
        if (error) {
          reject(error);
        } else if (results.rowCount === 0) {
          reject(new Error("A machine with this name already exists"));
        } else {
          resolve(`A new machine has been added: ${JSON.stringify(results.rows[0])}`);
        }
      }
    );
  });
};

const deleteMachine = (name) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "DELETE FROM machines where name = $1 RETURNING *;",
      [name],
      (error, results) => {
        if (error) {
          reject(error);
        } else if (results && results.rowCount > 0) {
          resolve(results.rows[0]);
        } else {
          reject(new Error("No Machine found with the given name"));
        }
      }
    );
  });
};

const getMachineDetails = (name) => {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM machines WHERE name = $1', [name], (error, results) => {
      if (error) {
        reject(error);
      } else if (results.rows.length > 0) {
        resolve(results.rows[0]);
      } else {
        resolve(null);
      }
    });
  });
};

const updateMachine = (name, body) => {
  return new Promise(function (resolve, reject) {
    const { Host, Username, Password, Port } = body;
    pool.query(
      "UPDATE machines SET host = $1, username = $2, password = $3, port = $4 WHERE name = $5 RETURNING *",
      [Host, Username, Password, Port, name],
      (error, results) => {
        if (error) {
          reject(error);
        } else if (results.rowCount === 0) {
          reject(new Error("No machine found with the given name"));
        } else {
          resolve(results.rows[0]);
        }
      }
    );
  });
};

module.exports = {
  getMachines,
  createMachine,
  deleteMachine,
  getMachineDetails,
  updateMachine
}