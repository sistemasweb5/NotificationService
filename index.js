const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib/callback_api');
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  
    methods: ["GET", "POST"],
  },
});

app.get('/', (req, res) => {
  res.send('Notification Service is running!');
});

function listenToJobEvents(retries = 5) {
  amqp.connect(rabbitmqUrl, (error0, connection) => {
    if (error0) {
      console.error('RabbitMQ connection failed:', error0.message);
      if (retries > 0) {
        console.log(`Retrying in 5 seconds... (${retries} retries left)`);
        setTimeout(() => listenToJobEvents(retries - 1), 5000);
      } else {
        console.error('Max retries reached. Could not connect to RabbitMQ.');
        process.exit(1);
      }
      return;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error('Failed to create a channel:', error1.message);
        return;
      }

      const exchange = 'job_events';

      channel.assertExchange(exchange, 'direct', { durable: false });

      channel.assertQueue('', { exclusive: true }, (error2, q) => {
        if (error2) {
          console.error('Failed to create a queue:', error2.message);
          return;
        }

        console.log(' [*] Waiting for events.');

        const eventTypes = ['JobMatched', 'JobAccepted', 'JobRejected', 'JobPropositionRequest'];
        eventTypes.forEach(eventType => {
          channel.bindQueue(q.queue, exchange, eventType);
        });

        channel.consume(q.queue, (msg) => {
          if (msg.content) {
            const event = JSON.parse(msg.content.toString());
            console.log(" [x] Received event:", event);

            const { type, details, userIds = [] } = event;

            let message;
            switch (type) {
              case 'JobMatched':
                message = 'Trabajo ha sido matcheado';
                io.emit('jobMatchedNotification', { message, jobDetails: details, userIds: userIds });
                break;
              case 'JobAccepted':
                message = 'Trabajo ha sido aceptado';
                io.emit('jobAcceptedNotification', { message, jobDetails: details, userIds: userIds });
                break;
              case 'JobRejected':
                message = 'Trabajo ha sido rechazado';
                io.emit('jobRejectedNotification', { message, jobDetails: details, userIds: userIds });
                break;
              case 'JobPropositionRequest':
                message = 'Propuesta de salario ha sido enviada';
                io.emit('jobPropositionNotification', { message, jobDetails: details, userIds: userIds });
                break;
              default:
                console.warn('Unknown event type:', type);
            }
          }
        }, { noAck: true });
      });
    });
  });
}

listenToJobEvents();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Notification Service corriendo en http://localhost:${PORT}`);
});
