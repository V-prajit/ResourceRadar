The discrepancy between the values produced by your Node.js script and the command cat /proc/stat | grep cpu | tail -1 | awk '{print ($5*100)/($2+$3+$4+$5+$6+$7+$8+$9+$10)}' | awk '{print "CPU Usage: " 100-$1}' likely arises from differences in how CPU usage is calculated and interpreted in each case. Let's break down the differences:
1. The Command Line Approach
The command you're using in the terminal works as follows:
* cat /proc/stat: This command outputs various statistics about the system, including CPU time spent in different modes.
* grep cpu: This filters the output to lines starting with "cpu".
* tail -1: This gets the last line of the output, which corresponds to the aggregate of all CPUs.
* The first awk command calculates the idle time percentage: ($5 * 100) / ($2+$3+$4+$5+$6+$7+$8+$9+$10).
* The second awk command then calculates the usage percentage as 100 - idle_percentage.
2. Your Node.js Script
In your Node.js script, you're doing something similar, but there are a few key differences:
* You're looking for a line that starts with cpu (with a space), which actually matches the first line of /proc/stat that gives an aggregate of all CPU time, not the last line.
* Your loop for (i=1; i<10; i++){} iterates over the values from index 1 to 9, which include user, nice, system, idle, iowait, irq, softirq, steal, and guest time. However, the guest time should typically not be included in this calculation.
* You're calculating cpu_usage as ((values[4] * 100) / sum), which is the percentage of time spent idle, not the usage percentage.
Resolving the Discrepancy
To align your Node.js script more closely with the command line approach, consider the following changes:
* Make sure to select the correct line from /proc/stat. If you want the aggregate of all CPUs, use the first line. If you want a specific CPU, adjust the grep command accordingly.
* Adjust the loop to exclude guest time (guest and guest_nice) in the calculation.
* Calculate the usage percentage as 100 - idle_percentage.
Revised Node.js Script
Here's a revised version of your script:


host1.on("ready", () => {
    console.log("Client :: ready");

    const fetchCpuUsage = () => {
        host1.exec("cat /proc/stat", (err, stream) => {
            if (err) throw err;
            stream.on("data", (data) => {

            }).stderr.on("data", (data) => {
                console.log('STDERR: ' + data);
            });
        });
    };

    setInterval(fetchCpuUsage, 1000);
}).connect(host1_details);

s, your script should produce results more in line with the command line output. However, keep in mind that CPU usage calculations can be complex, and slight differences in methodology can lead to different results.