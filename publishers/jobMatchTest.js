const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, channel) => {
    if (err) throw err;
    const exchange = 'job_events';

    const jobMatch = {
      type: 'JobMatched',
      message: "Do you wish to accept this job?",
      details: { 
        jobId: 123,
        userId: "123ftp"
      },
      workers: [{
        id: "sf1421",
        name: "Juan Perez"
      },
      {
        id: "s8ujii1",
        name: "Marta Perez"
      },{
        id: "123ftp",
        name: "Pepe Perez"
      },]
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
