const { Server } = require('socket.io')

const socketSingleton = (() => {
    this.io = null
    this.configure = (server) => {
        console.log('this.io', this.io)
        const socketConfig = new Server(server, {
            pingTimeout: 6000,
            cors: {
                origin: '*',
                credentials: true,
            },
        })

        if (!this.io) {
            this.io = socketConfig
        }
        return this
    }
    return this
})()

module.exports = socketSingleton
