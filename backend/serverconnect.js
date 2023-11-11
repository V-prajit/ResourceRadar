const { Client } = require("ssh2");

const host1 = new Client();
const host1_details = {
    host: "100.94.238.89",
    port: 22,
    username: "prajit",
    password: "root"
};

const fetchCpuUsage = () => {
    host1.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const output = data.toString();
            console.log(output);
        }).stderr.on("data", (data) => {
            console.log('STDERR: ' + data);
        });
    });
};

const fetchMemUsage = () => {
    
};



