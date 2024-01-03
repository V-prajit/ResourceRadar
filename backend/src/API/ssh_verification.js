const { Client } = require("ssh2");

const VerifyDetails = (forminput) => {
    return new Promise((resolve, reject) => {
        console.log(forminput);
        const check = new Client();
        const check_details = {
            host: forminput.Host,
            port: forminput.Port,
            username: forminput.Username,
            password: forminput.Password
        };
        check.on('error', function(err){
            check.end();
            reject(false); // Reject the promise on error
        });
        check.on("ready", () => {
            console.log("Client info verified");
            check.end()
            resolve(true);
        }).connect(check_details);
    })
}

module.exports =  VerifyDetails;