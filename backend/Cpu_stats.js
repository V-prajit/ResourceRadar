const host1 = require('./SSH_Client');

const fetchCpuUsage = () => {
    host1.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const output = data.toString();
            console.log("CPU Usage: " + output);
        }).stderr.on("data", (data) => {
            console.log('STDERR: ' + data);
        });
    });
};

module.exports = fetchCpuUsage;




