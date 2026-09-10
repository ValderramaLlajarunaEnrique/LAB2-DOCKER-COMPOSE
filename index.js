const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    laboratorio: 'Laboratorio 02 - Docker Compose',
    mensaje: 'Hola desde la API! Estudiante: Valderrama Llajaruna Enrique',
    puerto: PORT,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT} - Valderrama Llajaruna Enrique`);
});
