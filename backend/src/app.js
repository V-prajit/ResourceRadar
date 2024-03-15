require('dotenv').config();
const express = require('express');
const app = express();
const express_port = 3001;
const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000', // Replace with your React app's URL
};
app.use(cors(corsOptions));
const db_model = require('./API/postgres_connect.js');
app.use(express.json())
const VerifyDetails = require('./API/ssh_verification.js');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const SendGraphData = require('./API/graph_query.js')

app.get('/', (req, res) => {
    db_model.getMachines()
    .then(response => {
        res.status(200).send(response);
    })
    .catch(error => {
        res.status(500).send(error);
    })
})

app.post('/sshverify', async(req, res) => {
    const formData = req.body;
    try{
        const check_result = await VerifyDetails(formData);
        db_model.createMachine(formData)
        res.status(200).send({ verified: check_result });
    } catch (error){
        console.log(error);
        res.status(500).send({ verified: false, error: 'SSH verification failed' });
    }
});

const {monitorAllSystems, SendResources} = require('./SSH_Client.js')

app.get('/resourceusage', async (req, res) => {
    try {
        const allSystemUsage = await SendResources();
        res.json(allSystemUsage);
    }
    catch (error){
        console.error('Error', error);
        res.status(500).send("Server Error");
    }
});

app.post('/api/data/graph',async (req, res) => {
    const { host, timeFrame} = req.body;
    try{
        const data = await SendGraphData(host, timeFrame);
        res.status(200).json(data);
    } catch(error){
        console.error("Error retreiveing data:", error);
        res.status(500).send('Error retreiveing data')
    }
    
})

app.delete('/api/machine/:host', (req, res) => {
    const { host } = req.params;
    db_model.deleteMachine(host)
    .then(result => res.status(200).json({ message: result }))
    .catch(error => res.status(500).json({ error: error.message }));
});

setInterval(monitorAllSystems, 1000);

app.listen(express_port, () => {
    console.log(`App running on port ${express_port}.`);
})
