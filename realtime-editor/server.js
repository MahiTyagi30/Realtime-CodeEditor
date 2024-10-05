const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "build" directory
app.use(express.static('build'));

// Fallback route: If no route matches, serve index.html (for React Router)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// To keep track of users in rooms
const userSocketMap = {};
const userRooms = {}; // New map to keep track of which room a user is in

// Function to get all connected clients in a room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => ({
            socketId,
            username: userSocketMap[socketId], // Use the userSocketMap to get the username
        })
    );
}

// Handling socket connections
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // When a user joins a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // Check if username is already in the room
        const clients = getAllConnectedClients(roomId);
        const userExists = clients.some(client => client.username === username);

        if (userExists) {
            return socket.emit(ACTIONS.JOIN_FAILED, { message: 'Username already taken.' });
        }

        userSocketMap[socket.id] = username; // Map socketId to username
        userRooms[socket.id] = roomId; // Track which room the user is in
        socket.join(roomId); // Join the specified room

        const updatedClients = getAllConnectedClients(roomId);

        updatedClients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients: updatedClients,
                username,
                socketId: socket.id,
            });
        });

        console.log(`${username} joined room: ${roomId}`);
    });

    // Code change event: Broadcast to everyone except the sender
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle code sync when a user requests
   socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms);

        rooms.forEach((roomId) => {
            socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            delete userSocketMap[socket.id];
            delete userRooms[socket.id]; // Cleanup the room tracking
        }); 

        console.log(`${userSocketMap[socket.id]} disconnected`);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
