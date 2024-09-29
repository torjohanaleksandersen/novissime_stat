



export class ServerState {
    constructor() {
        this.tickSpeed = 100

        this.users = []
    }

    updateAllClients() {
        const information = []
        this.users.forEach(user => {
            information.push([user.socket.id, user.position, user.rotation])
        })
        this.users.forEach(user => {
            const informationForUser = information.filter(element => {return element[0] != user.socket.id})
            user.socket.emit('game-state-update', informationForUser)
        })
    }

    sendMsgToAllClients(key, data) {
        this.users.forEach(user => {
            user.socket.emit(key, data)
        })
    }
}