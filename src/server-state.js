



export class ServerState {
    constructor() {
        this.tickSpeed = 50

        this.users = []
    }

    updateAllClients() {
        const information = []
        this.users.forEach(user => {
            information.push([user.socket.id, user.position, user.rotation, user.yrot, user.state])
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