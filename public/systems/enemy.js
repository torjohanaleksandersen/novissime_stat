import * as THREE from '../imports/three.module.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'

const loader = new GLTFLoader()

export class Enemy {
    constructor () {
        this.mesh = new THREE.Object3D()

        loader.load('models/characters/Entente.character.glb', (gltf) => {
            const model = gltf.scene
            model.scale.setScalar(0.01) // Scale the model
            model.traverse((obj) => {
                if (obj.isMesh) {
                    obj.frustumCulled = false
                    if (obj.material) {
                        obj.material.roughness = 1
                        obj.material.needsUpdate = true
                    }
                }
            })
            this.mesh.add(model) // Add the loaded model to the mesh
        })
    }
}
