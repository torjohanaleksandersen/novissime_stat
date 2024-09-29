import { Entity } from '../components/entity.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'
import * as THREE from '../imports/three.module.js'
import { particles } from '../main.js'






const loader = new GLTFLoader()
export class Grenade extends Entity {
    constructor(timeToLive = 3000, scene) {
        super ()
        this.scene = scene
        loader.load('models/throwables/grenade.glb', (gltf) => {
            const model = gltf.scene
            this.add(model)
        })
        this.scale.setScalar(0.001)
        this.height = 0.2
        this.radius = 0.1
        this.groundFriction = 1.05
        this.timeToLive = timeToLive

        this.exploded = false

        this.rotate.set(0.001, 0, 0.001)
    }

    update(dt) {
        super.update(dt)
        if (this.timeToLive <= 0) {
            if (this.exploded) return
            this.exploded = true
            particles.grenadeExplosion(this.position)
            this.scene.remove(this)
        }
        if (this.onGround) {
            this.velocity.y = 0.5 * this.velocity.clone().length()
        }
    }
}