// const { Server } = require('socket.io')

const socket = (() => {
    this.io = null
    this.configure = (server) => {
        if (!this.io) {
            this.io = server
            console.log('this.io', this.io)
        }
        return this
    }
    return this
})()

module.exports = socket
