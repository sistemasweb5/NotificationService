const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, channel) => {
    if (err) throw err;
    const exchange = 'job_events';

    const jobMatch = {
      type: 'JobMatched',
      message: "¿Deseas aceptar este trabajo?",
      details: { 
        jobId: 123,
        workerId: "123ftp",
        workerName: "Juan Pérez",
        userId: "123ftp"
      },
      userIds: ["123ftp"]
    };

    channel.assertExchange(exchange, 'direct', { durable: false });
    channel.publish(exchange, 'JobMatched', Buffer.from(JSON.stringify(jobMatch)));
    console.log(" [x] Sent 'JobMatched' event");

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
