/* eslint-disable no-global-assign */
Promise = require('bluebird')
const { port } = require('./config/vars')
const SocketSingleton = require('./utils/socket')
const mongooseDatabase = require('./config/mongoose')
const app = require('./config/express')
const http = require('http')
mongooseDatabase.connect()
const server = http.createServer(app)

SocketSingleton.configure(server)

SocketSingleton.io.on('connection', (socket) => {
    console.log('New Connection established with SOCKET_ID', socket.id)

    socket.on('join', (roomId) => {
        if (roomId) {
            socket.join(roomId)
            console.log('Room Joined - RoomId: ', roomId)
        }
    })
})

// console.log("Socket Rooms", SocketSingleton.io.)
// SocketSingleton.io.on('join', (roomId) => {
//     SocketSingleton.io.join(roomId)
//     console.log('Room Joined - roomId: ', roomId)
// })

server.listen(port)

module.exports = app
