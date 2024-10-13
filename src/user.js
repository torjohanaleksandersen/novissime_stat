import { server } from "./index.js"






export class User {
    constructor (socket) {
        this.socket = socket

        this.position = []
        this.rotation = []
        this.yrot = 0
        this.state = {}
        this.shot = false
        this.health = 100

        this.socket.on('player-state-update', (data) => {
            [this.position, this.rotation, this.yrot, this.state] = data
        })

        this.socket.on('start-throw', () => {
            server.sendMsgToClients('start-throw-confirmed', this.socket.id, this.socket.id)
        })
        this.socket.on('perform-throw', (lookVector) => {
            server.sendMsgToClients('perform-throw-confirmed', [this.socket.id, lookVector], this.socket.id)
        })

        this.socket.on('player-shot', (data) => {
            if (this.shot) return
            const [position, normal] = data
            this.shot = true
            setTimeout(() => {
                this.shot = false
            }, 50)
            server.sendMsgToClients('player-shot-confirmed', [this.socket.id, position, normal], this.socket.id)
        })

        this.socket.on('player-hit', data => {
            const [id, bodyPart, position] = data
            const damage = 30
            server.sendMsgToClients('player-hit-confirmed', [id, position], this.socket.id)
            server.users.forEach(user => {
                if (user.socket.id == id) {
                    user.takeDamage(damage)
                }
            })
        })
    }

    takeDamage(dmg) {
        this.health -= dmg
        if (this.health <= 0) {
            this.state.dead = true
            this.socket.emit('youre-dead')
        } else {
            this.socket.emit('youre-hit', this.health)
        }
    }
}