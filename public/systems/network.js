





export class Network {
    constructor (socket, enemies) {
        this.socket = socket
        this.enemies = enemies

        this.socket.on('player-shot-confirmed', data => {
            const [id, position, normal] = data
            this.enemies.get(id).shot(position, normal)
        })

        this.socket.on('start-throw-confirmed', (id) => {
            this.enemies.get(id).throw()
        })
        this.socket.on('perform-throw-confirmed', (data) => {
            const [id, lookVector] = data
            this.enemies.get(id).doThrow(lookVector)
        })
    }

    sendPacketToServer(msg, data = null) {
        if (data === null) this.socket.emit(msg)
        this.socket.emit(msg, data)
    }
}