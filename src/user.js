





export class User {
    constructor (socket) {
        this.socket = socket

        this.position = []
        this.rotation = []


        this.socket.on('player-state-update', (data) => {
            this.position = data[0]
            this.rotation = data[1]
        })
    }
}