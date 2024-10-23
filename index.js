const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib/callback_api');
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ruta para la raíz (/)
app.get('/', (req, res) => {
  res.send('Notification Service is running!');
});

// Conexión a RabbitMQ con lógica de reintento
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
      return; // Exit early if there was an error
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error('Failed to create a channel:', error1.message);
        return; // Exit if channel creation fails
      }

      const exchange = 'job_events';

      // Declare the exchange
      channel.assertExchange(exchange, 'direct', { durable: false });

      // Create an exclusive queue for receiving events
      channel.assertQueue('', { exclusive: true }, (error2, q) => {
        if (error2) {
          console.error('Failed to create a queue:', error2.message);
          return; // Exit if queue creation fails
        }

        console.log(' [*] Waiting for events.');

        // Bind the queue to the exchange with the specified routing keys
        const eventTypes = ['JobMatched', 'JobAccepted', 'JobRejected', 'JobPropositionRequest'];
        eventTypes.forEach(eventType => {
          channel.bindQueue(q.queue, exchange, eventType);
        });

        // Consume messages from the queue
        channel.consume(q.queue, (msg) => {
          if (msg.content) {
            const event = JSON.parse(msg.content.toString());
            console.log(" [x] Received event:", event);

            // Emit event notifications via Socket.IO based on the event type
            switch (event.type) {
              case 'JobMatched':
                io.emit('jobMatchedNotification', { message: 'Trabajo ha sido matcheado', jobDetails: event.details });
                break;
              case 'JobAccepted':
                io.emit('jobAcceptedNotification', { message: 'Trabajo ha sido aceptado', jobDetails: event.details });
                break;
              case 'JobRejected':
                io.emit('jobRejectedNotification', { message: 'Trabajo ha sido rechazado', jobDetails: event.details });
                break;
              case 'JobPropositionRequest':
                io.emit('jobPropositionNotification', { message: 'Propuesta de salario ha sido enviada', jobDetails: event.details });
                break;
              default:
                console.warn('Unknown event type:', event.type);
            }
          }
        }, { noAck: true });
      });
    });
  });
}

// Iniciar el servidor y el listener de eventos
listenToJobEvents();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Notification Service corriendo en http://localhost:${PORT}`);
});
