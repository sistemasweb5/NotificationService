const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', (err, connection) => {
  if (err) throw err;
  connection.createChannel((err, channel) => {
    if (err) throw err;
    const exchange = 'job_events';
    const msg = JSON.stringify({ type: 'JobMatched', details: { jobId: 123 } });

    channel.assertExchange(exchange, 'direct', { durable: false });
    channel.publish(exchange, 'JobMatched', Buffer.from(msg));
    console.log(" [x] Sent 'JobMatched' event");

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  });
});
