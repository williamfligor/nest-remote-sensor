if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

if (!process.env.USERNAME || !process.env.PASSWORD) {
    console.error('Credentials missing');
}

// Setup Nest API with credentials
var NestApi = require('nest-api');
var nestApi = new NestApi(process.env.USERNAME, process.env.PASSWORD);

function tempConvert(celTemp) {
    var fahrTemp = celTemp * 9 / 5 + 32;
    // Round temp for homekit
    return Math.round(fahrTemp);
}


function getDataFromNest(sensorUdid) {
    return new Promise(function(resolve, reject) {
        console.log('Promise ran');
        nestApi.login(function(data) {
            nestApi.get(function(data) {
                var remoteSensor = data.kryptonite[sensorUdid];

                // Gem temp of remote sensor and return value in freedom units
                var currentRemoteTemp = tempConvert(remoteSensor.current_temperature);

                console.log('Currently ' + currentRemoteTemp + ' degrees');

                // Resolve promise and send back temp
                resolve(currentRemoteTemp)
            });
        });
    });
}


app.get('/', (req, res) => res.send('It Works!'))

app.get('/get-udid', function (req, res) {
    nestApi.login(function(data) {
        nestApi.get(function(data) {
            // console.log(data.kryptonite);

            // Print out list of UDIDs
            var listOfSensors = Object.keys(data.kryptonite);
            console.log('Active UDIDs on account');
            console.log(listOfSensors);
            res.send(listOfSensors)
        });
    });
});

app.get('/get-temp/:sensor', function (req, res) {

    // UDID of sensor requested
    var sensor = req.params["sensor"];

    console.log("checking temp for sensor : " + sensor);
    res.setHeader('Content-Type', 'application/json');

    console.log('no temp set - pulling from remote');

    // Run Async func to get data
    var getRemoteTemp = getDataFromNest(sensor);

    getRemoteTemp.then(function(result) {
        var remoteTemp = result;
        console.log('Remote temp = ' + remoteTemp);

        // Send response
        res.json({temperature: Number(remoteTemp)})
    }, function(err) {
        console.log(err);
    })
});

app.listen(port, () => console.log(`Nest Remote Sensor app listening on port ${port}!`))
