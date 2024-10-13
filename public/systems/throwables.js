import { Entity } from '../components/entity.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'
import * as THREE from '../imports/three.module.js'
import { audio, particles } from '../main.js'






const loader = new GLTFLoader()
export class Grenade extends THREE.Object3D {
    constructor() {
        super ()
        loader.load('models/throwables/grenade.glb', (gltf) => {
            const model = gltf.scene
            this.add(model)
        })

        this.throwingState = {
            scale: 0.008
        }
    }

    explode(position) {
        audio.playPositionalAudio('frag-grenade', position.x, position.y, position.z)
        particles.grenadeExplosion(position.clone())
    }
}


export class StunGrenade extends THREE.Object3D {
    constructor () {
        super()
        loader.load('models/throwables/stun-grenade.glb', (gltf) => {
            const model = gltf.scene
            this.add(model)
        })
        this.throwingState = {
            scale: 1
        }
    }

    explode(position) {
        particles.stunGrenadeExplosion(position.clone())
    }
}