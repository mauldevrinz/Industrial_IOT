import mqtt from 'mqtt';

const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
  protocolVersion: 4,
  clientId: 'test_' + Date.now(),
  rejectUnauthorized: false
});

client.on('connect', () => {
  console.log('Connected!');
  client.subscribe('iiot/sensors/#', (err) => {
    if (!err) {
      console.log('Subscribed to iiot/sensors/#');
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`${topic}: ${message.toString()}`);
});

client.on('error', (err) => {
  console.error('Error:', err);
});

setTimeout(() => {
  client.end();
}, 10000);
