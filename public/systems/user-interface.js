



export class UserInterface {
    constructor () {
        this.DOM = {
            in_gun: document.getElementById('in-gun'),
            in_inventory: document.getElementById('in-inventory'),
            health: document.querySelector('.health-amount'),
            stun_grenade: document.querySelector('.stun-grenade')
        }
    }

    stunGrenadeEffect() {
        const time = 2500, dt = 1
        let t = 0

        this.DOM.stun_grenade.style.display = 'block'

        const interval = setInterval(() => {
            if (t >= time) {
                this.DOM.stun_grenade.style.display = 'none'
                clearInterval(interval)
                return

            }
            const progress = (t / time) ** 2
            this.DOM.stun_grenade.style.opacity = 1 - progress
            t += dt
        }, dt)
    }

    updateAmmo(gun, inventory) {
        this.DOM.in_gun.innerText = gun
        this.DOM.in_inventory.innerText = inventory
    }

    updateHealth(health) {
        const percent = (health / 100)
        this.DOM.health.style.backgroundColor = `rgb(${255 - (percent - 1) * 200}, ${percent * 255}, ${percent * 255})`
        this.DOM.health.style.width = percent * 100 + '%'
    }
}