const express = require('express');
const cors = require('cors');
const ROSLIB = require('roslib');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Conexão com rosbridge
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

ros.on('connection', () => console.log('✅ Conectado ao ROS bridge'));
ros.on('error', (error) => console.log('❌ Erro na conexão ROS:', error));
ros.on('close', () => console.log('⚠️ Conexão ROS fechada'));

// ✅ Publicador para o tópico /cmd_vel (Scout Mini)
const cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: '/cmd_vel',  // sem namespace, como definido no bridge
  messageType: 'geometry_msgs/Twist'
});

// Endpoint para enviar comandos de movimento
app.post('/move', (req, res) => {
  const { linear, angular } = req.body;
  console.log('📩 Requisição para /move:', { linear, angular });

  if (typeof linear !== 'number' || typeof angular !== 'number' || isNaN(linear) || isNaN(angular)) {
    console.error('❌ Dados inválidos:', { linear, angular });
    return res.status(400).json({ error: 'Parâmetros linear e angular devem ser números válidos' });
  }

  const maxSpeed = 2.0;
  const clampedLinear = Math.max(-maxSpeed, Math.min(maxSpeed, linear));
  const clampedAngular = Math.max(-maxSpeed, Math.min(maxSpeed, angular));

  const twist = new ROSLIB.Message({
    linear: { x: clampedLinear, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: clampedAngular }
  });

  cmdVel.publish(twist);
  console.log('🚀 Comando enviado:', twist);

  res.json({ status: 'Movimento enviado', linear: clampedLinear, angular: clampedAngular });
});

// ❌ Remove endpoints exclusivos do turtlesim
// app.post('/reset', ...) e app.post('/clear', ...)

// Rota de teste
app.get('/test', (req, res) => {
  console.log('📩 Requisição recebida para /test');
  res.json({ status: 'Servidor funcionando com Scout Mini' });
});

app.listen(port, () => {
  console.log(`🌐 Servidor rodando em http://localhost:${port}`);
});
