import * as THREE from '../imports/three.module.js'
import { Animator } from './animator.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'
import { entities, particles } from '../main.js'
import { enemyHitBoxValues } from '../data/enemy-hitbox.js'
import { Grenade } from './throwables.js'

const loader = new GLTFLoader()
export class Enemy {
    constructor (mesh, scene, height, radius) {
        if (!mesh) return

        this.mesh = mesh
        this.scene = scene
        this.height = height
        this.radius = radius
        this.animator = new Animator(new THREE.AnimationMixer(this.mesh))
        this.skeleton = new THREE.SkeletonHelper(this.mesh)
        this.state = {}
        this.lastState = {}

        this.lookVector = new THREE.Vector3()
        this.rotation = new THREE.Euler()
        this.position = new THREE.Vector3(0, 0, 0)
        this.yrot = 0
        this.gun = {
            mesh: null
        }
        this.interpolationInterval = {
            position: null,
            rotation: null
        }
        this.shootingPause = false
        this.performThrow = false

        this.hitBoxes = []

        loader.load('models/guns/AK47.glb', (gltf) => {
            const model = gltf.scene
            model.scale.setScalar(1750)
            model.position.set(-100, 1000, 200)
            model.rotation.set(0.03, Math.PI, Math.PI / 2 - 0.07)

            this.gun.mesh = model
            this.skeleton.bones.forEach(bone => {
                if (bone.name == 'mixamorigRightHand') {
                    bone.add(this.gun.mesh)

                    const grenade = new Grenade(this.scene).clone()
                    this.grenade = grenade
                    grenade.scale.setScalar(7)
                    grenade.position.z = 300
                    grenade.rotation.y = 2
                    grenade.visible = false
                    bone.add(grenade)
                }
            })
            this.makeHitBox()
        })
    }

    makeHitBox() {
        const material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
        const geometry = new THREE.BoxGeometry(1000, 1000, 1000)
        const mesh = new THREE.Mesh(geometry, material)
        this.skeleton.bones.forEach(bone => {
            for (const name in enemyHitBoxValues) {
                const element = enemyHitBoxValues[name]
                if (bone.name == name) {
                    const box = mesh.clone()
                    box.scale.copy(element.scale.clone())
                    box.position.copy(element.position.clone())
                    box.userData.bodyPart = element.name
                    bone.add(box)
                    this.hitBoxes.push(box)
                }

            }
        })
    }

    onStateChange() {
        if (this.state.throwing) return
        if (this.state.movement == 'running') {
            if (!this.state.reloading) this.animator.play('fps_run')
        } else if (this.state.movement == 'walking') {
            if (this.state.reloading) {
                this.animator.play('walking_reloading')
            } else {
                this.animator.play('walk_aim')
            }
        } else {
            if (!this.state.reloading) this.animator.play('fps_standard')
        }

        if (this.state.reloading && this.state.movement !== 'walking') {
            this.animator.play('reloading')
        }

        if (this.state.dead) {
            this.animator.play('death')
        }
    }

    shot(position, normal) {
        particles.muzzleFlash(this.position, this.gun.mesh)
        if (position && normal) {
            particles.bulletWallCollision(new THREE.Vector3(...position), new THREE.Vector3(...normal))
        }
    }

    doThrow(lookvec) {
        this.lookVector.set(...lookvec)
        this.performThrow = true
    }

    throw() {
        if (this.state.throwing || this.state.reloading) return
        this.state.throwing = true
        this.animator.play('throwable')

        setTimeout(() => {
            if (!this.state.throwing) return
            this.gun.mesh.visible = false
            this.grenade.visible = true
            setTimeout(() => {
                this.animator.timeMultiplayer = 0

                const interval = setInterval(() => {
                    if (this.performThrow) {
                        this.animator.timeMultiplayer = 1
                        performThrow(this.lookVector, this.scene, this.position.clone().add(new THREE.Vector3(0, 0.7, 0)))
                        clearInterval(interval)
                        setTimeout(() => {
                            this.gun.mesh.visible = true
                            this.grenade.visible = false
                            this.state.throwing = false
                            this.performThrow = false
                        }, 1000)
                    }
                }, 100)
    
            }, 1000)
        }, 400)

        function performThrow(lookVec, scene, position) {
            setTimeout(() => {
                const grenade = new Grenade(10000, scene)
                grenade.position.copy(position.clone())
                grenade.velocity.copy(lookVec.clone().multiplyScalar(5))
                grenade.acceleration.y = -2
                entities.push(grenade)
                scene.add(grenade)
            }, 500)
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
        if (this.interpolationInterval.position) clearInterval(this.interpolationInterval.position)
        let dt = 1, time = 25, t = 0
        const startPosition = this.position.clone(); // Store the starting position
        const targetPosition = new THREE.Vector3(...position); // Target position
    
        this.interpolationInterval.position = setInterval(() => {
            if (t >= time) {
                this.position.copy(targetPosition); // Set final position to the target
                this.mesh.position.copy(this.position.clone().sub(new THREE.Vector3(0, this.height / 2 + this.radius, 0)));
                clearInterval(this.interpolationInterval.position); // Stop the interval
            } else {
                t += dt;
                const progress = t / time;
    
                // Interpolate between start and target
                this.position.lerpVectors(startPosition, targetPosition, progress);
                this.mesh.position.copy(this.position.clone().sub(new THREE.Vector3(0, this.height / 2 + this.radius, 0))); // Update the mesh position
            }
        }, dt);
    }

    interpolateRotations(yrot) {
        if (this.interpolationInterval.rotation) clearInterval(this.interpolationInterval.rotation)
    
        let dt = 1, time = 25, t = 0;
        const startRotation = this.mesh.rotation.y; // Starting rotation
        const targetRotation = yrot; // Target rotation
    
        // Adjust rotation to take the shortest path
        let deltaRotation = targetRotation - startRotation;
        
        // Make sure deltaRotation is in the range [-π, π]
        if (deltaRotation > Math.PI) {
            deltaRotation -= 2 * Math.PI;
        } else if (deltaRotation < -Math.PI) {
            deltaRotation += 2 * Math.PI;
        }
    
        this.interpolationInterval.rotation = setInterval(() => {
            if (t >= time) {
                this.yrot = targetRotation;
                this.mesh.rotation.y = targetRotation;
                clearInterval(this.interpolationInterval.rotation);
            } else {
                t += dt;
                const progress = t / time;
    
                // Interpolate the rotation using the adjusted delta
                this.yrot = startRotation + deltaRotation * progress;
                this.mesh.rotation.y = this.yrot; // Update the mesh's rotation
            }
        }, dt);
    }
    
    

    update(dt) {
        this.animator.update(dt)
        this.mesh.rotation.y = this.yrot
    }
}
