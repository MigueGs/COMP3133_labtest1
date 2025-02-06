// Asegúrate de que el socket esté correctamente configurado
const socket = io("http://localhost:3000");
let currentRoom = "";

// Unir al chat en el momento en que se selecciona una sala
document.getElementById("joinBtn").addEventListener("click", () => {
    currentRoom = document.getElementById("roomSelect").value;
    socket.emit("joinRoom", currentRoom);
});

// Enviar mensajes al servidor
document.getElementById("sendBtn").addEventListener("click", () => {
    const message = document.getElementById("messageInput").value;
    if (message.trim() !== "") {
        socket.emit("chatMessage", { from_user: "testUser", room: currentRoom, message });
        document.getElementById("messageInput").value = "";  // Limpiar el input después de enviar
    }
});

// Escuchar nuevos mensajes y mostrarlos en el chat
socket.on("message", (data) => {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML += `<p><strong>${data.from_user}:</strong> ${data.message}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight; // Asegurarse de que siempre se vea el último mensaje
});

// Manejar el cierre de sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html"; // Redirige al login
});

