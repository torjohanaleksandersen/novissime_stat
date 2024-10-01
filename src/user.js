





export class User {
    constructor (socket) {
        this.socket = socket

        this.position = []
        this.rotation = []
        this.yrot = 0
        this.state = {}

        this.socket.on('player-state-update', (data) => {
            [this.position, this.rotation, this.yrot, this.state] = data
        })
    }
}