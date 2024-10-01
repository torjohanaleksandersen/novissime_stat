import * as THREE from '../imports/three.module.js'
import { Animator } from './animator.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'
import { particles } from '../main.js'

const loader = new GLTFLoader()
export class Enemy {
    constructor (mesh, scene, height) {
        if (!mesh) return

        this.mesh = mesh
        this.scene = scene
        this.height = height
        this.animator = new Animator(new THREE.AnimationMixer(this.mesh))
        this.skeleton = new THREE.SkeletonHelper(this.mesh)
        this.state = {}
        this.lastState = {}

        this.rotation = new THREE.Euler()
        this.position = new THREE.Vector3(0, 0, 0)
        this.yrot = 0
        this.gun = {
            mesh: null
        }
        this.interpolationInterval = null

        loader.load('models/guns/AK47.glb', (gltf) => {
            const model = gltf.scene
            model.scale.setScalar(1750)
            model.position.set(-100, 1000, 200)
            model.rotation.set(0.03, Math.PI, Math.PI / 2 - 0.07)

            this.gun.mesh = model
            this.skeleton.bones.forEach(bone => {
                if (bone.name == 'mixamorigRightHand') {
                    bone.add(this.gun.mesh)
                }
            })
        })
    }

    onStateChange() {
        if (this.state.movement == 'running') {
            if (!this.state.reloading) this.animator.play('fps_run')
        } else if (this.state.movement == 'walk') {
            if (!this.state.reloading) this.animator.play('walk_aim')
        } else {
            if (!this.state.reloading) this.animator.play('fps_standard')
        }

        if (this.state.reloading) {
            this.animator.play('reloading')
        }

        if (this.state.shooting) {
            particles.muzzleFlash(this.position, this.gun.mesh)
            setTimeout(() => {

            }, )
        }
    }

    updateState(state) {
        this.state = Object.assign({}, state);
        for (const attribute in this.state) {
            if (this.state[attribute] != this.lastState[attribute]) {
                this.onStateChange()
                this.lastState = Object.assign({}, this.state);
            }
        }
    }

    interpolatePositions(position) {
        if (this.interpolationInterval) clearInterval(this.interpolationInterval)
        let dt = 1, time = 20, t = 0
        const startPosition = this.position.clone(); // Store the starting position
        const targetPosition = new THREE.Vector3(...position); // Target position
    
        this.interpolationInterval = setInterval(() => {
            if (t >= time) {
                this.position.copy(targetPosition); // Set final position to the target
                this.mesh.position.copy(this.position.clone().sub(new THREE.Vector3(0, this.height / 2, 0)));
                clearInterval(this.interpolationInterval); // Stop the interval
            } else {
                t += dt;
                const progress = t / time;
    
                // Interpolate between start and target
                this.position.lerpVectors(startPosition, targetPosition, progress);
                this.mesh.position.copy(this.position.clone().sub(new THREE.Vector3(0, this.height / 2, 0))); // Update the mesh position
            }
        }, dt);
    }
    

    updateGunTransform() {
        if (!this.gun.mesh) return
    }

    update(dt) {
        this.updateGunTransform()
        this.animator.update(dt)
    }
}
