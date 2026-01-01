const socketio = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketio(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Join user-specific room for targeted notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId.toString());
                console.log(`👤 User ${userId} joined their notification room`);
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitNotification = (userId, notification) => {
    if (io) {
        io.to(userId.toString()).emit('notification', notification);
        console.log(`📡 Real-time notification emitted to user ${userId}`);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitNotification
};
