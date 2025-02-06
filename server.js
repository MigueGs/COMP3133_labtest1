require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log(err));

// Esquema de Usuario
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    firstname: String,
    lastname: String,
    password: String,
    createdon: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// Esquema de Mensajes
const MessageSchema = new mongoose.Schema({
    from_user: String,
    room: String,
    message: String,
    date_sent: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// Rutas de Autenticación
app.post("/signup", async (req, res) => {
    try {
        const { username, firstname, lastname, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, firstname, lastname, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Usuario creado" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

// Configuración de Socket.io
io.on("connection", (socket) => {
    console.log("🔵 Usuario conectado:", socket.id);

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`👥 Usuario se unió a la sala: ${room}`);
    });

    socket.on("chatMessage", async (data) => {
        const { from_user, room, message } = data;
        const newMessage = new Message({ from_user, room, message });
        await newMessage.save();
        io.to(room).emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado");
    });
});

server.listen(3000, () => console.log("🚀 Servidor corriendo en el puerto 3000"));

