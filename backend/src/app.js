require('dotenv').config();
const express = require('express');
const app = express();
const express_port = 3001;
const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000', // Replace with your React app's URL
};
app.use(cors(corsOptions));
const db_model = require('./API/postgres_connect.js')
app.use(express.json())
const VerifyDetails = require('./API/ssh_verification.js')

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

const monitorAllSystems = require('./SSH_Client.js')

setInterval(monitorAllSystems, 1000);

app.listen(express_port, () => {
    console.log(`App running on port ${express_port}.`);
  })