'use strict';

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;
var os = require('os');

var localClient = undefined;


Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    throw err;
  } else {
    localClient = client;

    client.on('error', function (err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized');

        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          pipeMessage(client, inputName, msg);
        });
      }
    });
  }
});

// This function just pipes the messages without any change.
function pipeMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));

  if (inputName === 'input1') {
    var message = msg.getBytes().toString('utf8');
    if (message) {
      var outputMsg = new Message(message);
      client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
    }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}


setInterval(function () {
  var message = new Message(JSON.stringify({
    cpu: os.cpus(),
    totalmem: os.totalmem(),
    freemem: os.freemem()
  }));

  console.log('Sending cpu and memory stats: ' + message.getData());

  // Send the message.
  localClient.sendOutputEvent('stats', message, printResultFor('Sending cpu and memory stats'));
}, 5000);
