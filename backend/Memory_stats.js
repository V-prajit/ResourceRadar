const host1 = require('./SSH_Client');

const fetchMemoryUsage = () => {
    host1.exec("top -bn1 | grep 'MiB Mem' | awk '{print \"Total: \" $4 \" MB, Used: \" $8 \" MB, Free: \" $10 \" MB\"}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const output = data.toString();
            console.log("Memory Usage: " + output);
        }).stderr.on("data", (data) => {
            console.log('STDERR: ' + data);
        });
    });
};


module.exports = fetchMemoryUsage;
