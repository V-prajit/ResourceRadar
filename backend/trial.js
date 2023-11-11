const { Client } = require("ssh2");

const host1 = new Client();
host: "100.94.238.89",
port: 22,
username: "prajit",
password: "root"

host1.on("ready", () => {
    console.log("Client :: ready");

    // Function to execute the command
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

    setInterval(fetchCpuUsage, 1000);
}).connect(host1_details);

