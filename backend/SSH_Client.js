const { Client } = require("ssh2");
require('dotenv').config();

const host1 = new Client();
const host1_details = {
    host: process.env.HOST,
    port: process.env.PORT,
    username: process.env.USERNAME,
    password: process.env.PASSWORD
};

host1.on("ready", () => {
    console.log("Client :: ready");
}).connect(host1_details);

module.exports = host1;
