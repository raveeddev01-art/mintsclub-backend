/* eslint-disable no-global-assign */
Promise = require('bluebird')
const { port } = require('./config/vars')
const socket = require('./utils/socket')
const mongooseDatabase = require('./config/mongoose')
const app = require('./config/express')
const http = require('http')
mongooseDatabase.connect()
const server = http.createServer(app)
const io = require('socket.io')(server, {
    pingTimeout: 6000,
    cors: {
        origin: '*',
        credentials: true,
    },
})

socket.configure(io)

io.on('connection', (socketIo) => {
    console.log('New Connection established with SOCKET_ID', socketIo.id)

    socketIo.on('join', (roomId) => {
        if (roomId) {
            socketIo.join(roomId)
            console.log('Room Joined - RoomId: ', roomId)
        }
    })

    socketIo.on('leave', (roomId) => {
        if (roomId) {
            socketIo.leave(roomId)
            console.log('Room leaved - RoomId: ', roomId)
        }
    })
})

server.listen(port)

module.exports = app
