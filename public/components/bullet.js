import { Entity } from "./entity.js";
import * as THREE from '../imports/three.module.js'



export class Bullet extends Entity {
    constructor (scene, x, y, z, velocity, maxVelocity) {
        super()
        this.scene = scene
        this.velocity.set(velocity.x, velocity.y, velocity.z)
        this.position.set(x, y, z)
        this.velocity.normalize().multiplyScalar(maxVelocity)
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05)
        const material = new THREE.MeshBasicMaterial({color: 0xffffff})
        this.mesh = new THREE.Mesh(geometry, material)
        this.scene.add(this.mesh)
    }

    update(dt) {
        super.update(dt)
        this.mesh.position.copy(this.position.clone())
    }
}