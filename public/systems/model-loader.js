import * as THREE from '../imports/three.module.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'


export class Loader {
    constructor () {
        this.loader = new GLTFLoader()
        this.models = new Map()
    }

    load(path, id) {
        this.loader.load(path, (gltf) => {
            const model = gltf.scene
            this.models.set(id, model)
        })
    }

    getModel(id) {
        return this.models.get(id)
    }
}