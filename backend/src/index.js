/* eslint-disable no-global-assign */
Promise = require('bluebird')

const { Server } = require('socket.io')
const WEB_SOCKET_PORT = 6969
const { port } = require('./config/vars')

const mongooseDatabase = require('./config/mongoose')
const app = require('./config/express')
const http = require('http')
mongooseDatabase.connect()

const server = http.createServer(app)

const io = new Server(server, {
    pingTimeout: 6000,
    cors: {
        origin: '*',
    },
})

io.on('connection', (socket) => {
    console.log('Connected to socket.io', socket?.id)

    socket.on('setup', (data) => {
        socket.join(data?.nftId)
        socket.emit('connected', { connected: true })
    })

    socket.on('bidPlaced', (bidDetails) => {
        const { price, blockchainType } = bidDetails

        let updatedPrice = undefined

        if (blockchainType === 'algorand') {
            updatedPrice = 0.1 + parseFloat(price)
        } else {
            updatedPrice = (
                (parseFloat(price) / 100) * 5 +
                parseFloat(price)
            ).toFixed(8)
        }

        socket
            .in(bidDetails?.nftId)
            .emit('newBid', { ...bidDetails, price: updatedPrice })
    })

    socket.on('placingBid', (bidPlacingDetails) => {
        socket
            .in(bidPlacingDetails?.nftId)
            .emit('placingBidBySomeone', bidPlacingDetails)
    })

    socket.off('setup', () => {
        socket.leave(data?.nftId)
    })
})

server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`)
})

module.exports = app
