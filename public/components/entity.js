import * as THREE from '../imports/three.module.js'


const vec_3 = new THREE.Vector3()

export class Entity extends THREE.Group {
    constructor () {
        super()
        this.velocity = new THREE.Vector3(0, 0, 0)
        this.acceleration = new THREE.Vector3(0, 0, 0)
        this.rotate = new THREE.Vector3(0, 0, 0)
        this.rotationDamping = 1

        this.timeToLive = 0

        this.height = 0
        this.radius = 0
        this.onGround = false
        this.groundFriction = 0

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
        this.timeToLive -= dt * 1000
        this.velocity.add(this.acceleration.clone().multiplyScalar(dt))
        this.position.add(this.velocity.clone().multiplyScalar(dt))
        this.mesh.position.copy(this.position.clone())

        this.rotation.x += this.rotate.x
        this.rotation.y += this.rotate.y
        this.rotation.z += this.rotate.z
        this.rotate.set(
            this.rotate.x / (this.rotationDamping),
            this.rotate.y / (this.rotationDamping),
            this.rotate.z / (this.rotationDamping)
        )

        if (this.onGround && this.groundFriction > 0) {
            this.velocity.multiplyScalar(1 / this.groundFriction)
            if (this.groundFriction <= 0.1) this.groundFriction = 0
        }
    }
}