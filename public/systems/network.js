





export class Network {
    constructor (socket, enemies) {
        this.socket = socket
        this.enemies = enemies

        this.socket.on('player-shot-confirmed', id => {
            this.enemies.get(id).shot()
        })
    }

    sendPacketToServer(msg, data = null) {
        if (data === null) this.socket.emit(msg)
        this.socket.emit(msg, data)
    }
}