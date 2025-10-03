require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// CORS middleware - allow React frontend origin
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Body parser middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/bus'));  
app.use('/api/students', require('./routes/student')); 
app.use('/api/drivers', require('./routes/driver'));
app.use("/api/school", require("./routes/schoolRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// ---------------------- SOCKET.IO ---------------------- //
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  // Listen for driver location updates
  socket.on("updateLocation", (data) => {
    // data = { driverId, latitude, longitude }
    console.log("Location update:", data);
    io.emit("locationUpdated", data); // broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ---------------------- START SERVER ---------------------- //
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
