import * as THREE from '../imports/three.module.js'


const vec_3 = new THREE.Vector3()

export class Entity {
    constructor () {
        this.position = new THREE.Vector3(0, 0, 0)
        this.velocity = new THREE.Vector3(0, 0, 0)
        this.acceleration = new THREE.Vector3(0, 0, 0)
        this.rotation = new THREE.Euler()

        this.height = 0
        this.radius = 0
        this.onGround = false

        this.mesh = new THREE.Mesh()
    }

    getWorldVelocity() {
        vec_3.copy(this.velocity)
        vec_3.applyEuler(new THREE.Euler(0, this.rotation.y, 0))
        return vec_3
    }

    applyWorldDeltaVelocity(dv) {
        dv.applyEuler(new THREE.Euler(0, - this.rotation.y, 0))
        this.velocity.add(dv)
    }

    update(dt) {
        this.velocity.add(this.acceleration.clone().multiplyScalar(dt))
        this.position.add(this.velocity.clone().multiplyScalar(dt))

        this.mesh.position.copy(this.position.clone())
    }
}