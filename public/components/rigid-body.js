import { Capsule } from '../imports/Capsule.js'
import * as THREE from '../imports/three.module.js'

export class RigidBody extends THREE.Object3D{
    constructor (
        position = new THREE.Vector3(0, 0, 0), 
        velocity = new THREE.Vector3(0, 0, 0),
        height = 0,
        radius = 0,
        mesh = new THREE.Mesh()
    ) {
        super()
        this.timeToLive = 10000
        this.collider = new Capsule(
            position.clone().sub(new THREE.Vector3(0, height / 2, 0)),
            position.clone().add(new THREE.Vector3(0, height / 2, 0)),
            radius
        )
        this.position.copy(position.clone())
        this.velocity = velocity.clone()
        this.acceleration = new THREE.Vector3(0, 0, 0)
        this.onGround = false
        this.dampingScale = 1
        this.add(mesh)
    }
}