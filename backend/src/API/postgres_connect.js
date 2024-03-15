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
    const { Name, Host, Username, Password, Port } = body;
    pool.query(
      "INSERT INTO machines (name, host, username, password, port) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [Name, Host, Username, Password, Port],
      (error, results) => {
        if (error) {
          reject(error);
        }
        if (results && results.rows) {
          resolve(
            `A new merchant has been added: ${JSON.stringify(results.rows[0])}`
          );
        } else {
          reject(new Error("Something went wrong"));
        }
      }
    );
  });
};

const deleteMachine = (host) => {
  return new Promise(function (resolve, reject) {
    pool.query(
      "DELETE FROM machines where host = $1 RETURNING *;",
      [host],
      (error, results) => {
        if (error) {
          reject(error);
        } else if (results && results.rowCount > 0) {
          resolve(`Machine deleted successfully: ${JSON.stringify(results.rows[0])}`);
        } else {
          reject(new Error("No Machine found with the ip"));
        }
      }
    );
  });
};


module.exports = {
  getMachines,
  createMachine,
  deleteMachine
}