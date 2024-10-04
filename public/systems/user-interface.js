



export class UserInterface {
    constructor () {
        this.DOM = {
            in_gun: document.getElementById('in-gun'),
            in_inventory: document.getElementById('in-inventory'),
            health: document.querySelector('.health-amount')
        }
    }

    updateAmmo(gun, inventory) {
        this.DOM.in_gun.innerText = gun
        this.DOM.in_inventory.innerText = inventory
    }

    updateHealth(health) {
        this.DOM.health.style.width = (health / 100) * 100 + '%'
    }
}