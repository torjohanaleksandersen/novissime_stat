



export class UserInterface {
    constructor () {
        this.DOM = {
            in_gun: document.getElementById('in-gun'),
            in_inventory: document.getElementById('in-inventory')
        }
    }

    updateAmmo(gun, inventory) {
        this.DOM.in_gun.innerText = gun
        this.DOM.in_inventory.innerText = inventory
    }
}