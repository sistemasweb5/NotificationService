const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, channel) => {
    if (err) throw err;
    const exchange = 'job_events';

    const jobRejected = {
      type: 'JobRejected',
      message: "Your job application has been rejected.",
      details: { 
        jobId: 456,
        userId: "123ftp",
        workerId: "123ftp"
      }
    };

    channel.assertExchange(exchange, 'direct', { durable: false });
    channel.publish(exchange, 'JobRejected', Buffer.from(JSON.stringify(jobRejected)));
    console.log(" [x] Sent 'JobRejected' event");

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});