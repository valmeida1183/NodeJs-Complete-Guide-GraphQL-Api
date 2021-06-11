const { Server } = require('socket.io');

const errorHelper = require('./error.helper');

let io;

const initializeSocket = httpServer => {
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    return io;
};

const getInputOutput = () => {
    if (!io) {
        errorHelper.throwError('Socket.io is not initialized!', 500);
    }

    return io;
};

module.exports = {
    init: initializeSocket,
    getIo: getInputOutput,
};
