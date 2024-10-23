const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración de una ruta simple
app.get('/', (req, res) => {
  res.send('<h1>Servidor de notificaciones en tiempo real</h1>');
});

// Manejo de conexión de socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Ejemplo de evento enviado al cliente
  socket.emit('mensaje', 'Bienvenido al sistema de notificaciones');

  // Escuchar mensajes desde el cliente
  socket.on('mensaje_cliente', (msg) => {
    console.log('Mensaje recibido del cliente:', msg);
  });

  // Cuando el cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
