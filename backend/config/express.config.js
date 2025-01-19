const express = require('express');
const { Server } = require("socket.io");
const http = require('http');

const applyExpressMiddlewares = require('../middleware/expressMiddlewares')

//just to make sure any error doesnt go to client (in last part of index.js)
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: 'Internal Server Error (first appUse)' });
// });

const app = express();
const server = http.createServer(app)
const io = new Server(server, {
    maxHttpBufferSize: 1e8
});

applyExpressMiddlewares(app);

module.exports = { 
    app,
    io,
    server,
};