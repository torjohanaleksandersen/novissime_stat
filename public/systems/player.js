import { Entity } from "../components/entity.js";
import * as THREE from '../imports/three.module.js'
import { entities, inputs, userInterface } from "../main.js";
import { FBXLoader } from "../imports/FBXLoader.js";
import { Animator } from "./animator.js";
import { GLTFLoader } from "../imports/GLTFLoader.js";
import { Gun } from "./gun.js";
import { offsetValues } from "../data/offset_values.js";
import { Grenade } from "./grenade.js";


export class Player extends Entity {
    constructor (camera, scene) {
        super()
        this.camera = camera
        this.scene = scene
        this.animator = null
        this.model = new THREE.Object3D()
        this.gun = new THREE.Object3D()

        inputs.registerHandler('keydown', this.keydown.bind(this))
        inputs.registerHandler('keyup', this.keyup.bind(this))
        inputs.registerHandler('mousedown', (e) => {
            if (e.button == 0 && this.gun) {
                this.shoot()
            } else if (e.button == 2 && this.gun) {
                this.aim(true)
            }
        })
        inputs.registerHandler('mouseup', (e) => {
            if (e.button == 0 && this.gun) {
                this.state.shooting = false
            } else if (e.button == 2 && this.gun) {
                this.aim(false)
            }
        })

        this.position.y = 5

        this.height = 1.8
        this.radius = 0.4

        this.maxSpeed = 3
        this.accelerationValue = 10
        this.decelerationValue = 20

        this.inputs = {
            w: false,
            s: false,
            a: false,
            d: false
        }
        this.performThrow = false

        this.inventory = {
            ammo: 50
        }

        
        const loader = new GLTFLoader()
        loader.load('models/characters/fps_entente.glb', gltf => {
            const model = gltf.scene
            model.scale.setScalar(0.01)
            model.rotation.x = - Math.PI / 2
            this.animator = new Animator(new THREE.AnimationMixer(model))

            const skeleton = new THREE.SkeletonHelper(model)
            const bones = skeleton.bones

            model.traverse(child => {
                if (child.isMesh) {
                    child.frustumCulled = false
                    if (child.material) {
                        child.material.depthTest = true
                        child.material.depthWrite = true
                    }
                }
            })

            this.model.add(model)

            let leftarm = null
            bones.forEach(bone => {if (bone.name == 'mixamorigLeftHand') leftarm = bone})

            bones.forEach(bone => {
                if (bone.name == 'mixamorigRightHand') {
                    const model = new Gun(this.scene, this.camera, leftarm)
                    this.gun = model
                    bone.add(model)


                    const grenade = new Grenade(this.scene).clone()
                    this.grenade = grenade
                    grenade.scale.setScalar(7)
                    grenade.position.z = 300
                    grenade.rotation.y = 2
                    grenade.visible = false
                    bone.add(grenade)
                }
            })
        })
        this.offset = new THREE.Vector3(0, -1.6, 0)
        this.rotate = new THREE.Vector3(0, 0, 0)

        this.state = {
            movement: 'idle',
            aiming: false,
            reloading: false,
            shooting: false,
            throwing: false
        }
        this.lastState = Object.assign({}, this.state);

        this.changingArmsPosition = false
        this.requestToChangeArmPosition = false
    }

    recoilAnimation() {
        const origin = {
            x: this.offset.x,
            z: this.offset.z
        }
        function recoil(x) {
            // Ensure x is a number, rounded to 3 decimal places
            x = parseFloat(x.toFixed(3));

            function moment(t) {
                return ((t*2 - 1) ** 2 - 1)
            }
    
            return new THREE.Vector3(
                0.01 * (moment(x) - moment(x - (10 / 150))),
                0,
                0.05 * (moment(x) - moment(x - (10 / 150)))
            );
        }
    
        const dt = 10;
        const maxTime = 150;
        let time = 0;
    
        // Set up the interval
        const interval = setInterval(() => {
            if (time > maxTime) {
                this.offset.x = origin.x
                this.offset.z = origin.z
                clearInterval(interval); // Stop the animation
            } else {
                // Calculate recoil position only once
                const recoilOffset = recoil(time / maxTime);
                this.offset.z += recoilOffset.z;
                this.offset.x += recoilOffset.x;

                const worldQuaternion = new THREE.Quaternion();
                this.camera.getWorldQuaternion(worldQuaternion);

                const forwardVector = new THREE.Vector3(0, 0, -1);

                forwardVector.applyQuaternion(worldQuaternion);
                const xrot = new THREE.Euler().setFromVector3(forwardVector).y;
                if (xrot < 0.7) {
                    const factor = 1 - (xrot / 0.7)
                    this.camera.rotateX(factor * 3 * recoil(time).x / maxTime)
                }

                time += dt; // Increment time
            }
        }, dt);
    }
    
    updateArmTransform(position = new THREE.Vector3(0, -1.6, 0), rotation = new THREE.Vector3(0, 0, 0), dt = 5, maxTime = 150) {
        if (
            position.x == this.offset.x &&
            position.y == this.offset.y &&
            position.z == this.offset.z &&
            rotation.x == this.rotate.x &&
            rotation.y == this.rotate.y &&
            rotation.z == this.rotate.z
        ) {
            return
        }
        if (this.schangingArmsPosition) {
            this.requestToChangeArmPosition = true
        }
    
        const startOffset = this.offset.clone()
        const startRotation = this.rotate.clone()
        
        let dx = position.x - this.offset.x
        let dy = position.y - this.offset.y
        let dz = position.z - this.offset.z
    
        let dxr = rotation.x - this.rotate.x
        let dyr = rotation.y - this.rotate.y
        let dzr = rotation.z - this.rotate.z
    
        let t = 0;
        const interval = setInterval(() => {
            this.schangingArmsPosition = true
            t += dt;
            const percentage = t / maxTime;
    
            if (this.requestToChangeArmPosition) {
                clearInterval(interval)
                this.requestToChangeArmPosition = false
            }

            if (percentage >= 1) {
                this.offset.copy(position);
                this.rotate.copy(rotation);
                clearInterval(interval);
                this.schangingArmsPosition = false;
                return;
            }
    
            // Smoothly transition offsets and rotations
            this.offset.x = startOffset.x + dx * percentage;
            this.offset.y = startOffset.y + dy * percentage;
            this.offset.z = startOffset.z + dz * percentage;
    
            this.rotate.x = startRotation.x + dxr * percentage;
            this.rotate.y = startRotation.y + dyr * percentage;
            this.rotate.z = startRotation.z + dzr * percentage;
    
        }, dt);
    }
    

    onStateChange() {
        if (!this.state.aiming) {
            if (this.state.reloading || this.state.throwing) {
                if (this.state.movement == 'running') this.state.movement = 'walking'
                return
            }
            if (this.state.movement == 'running') {
                this.updateArmTransform(new THREE.Vector3(-0.1, -1.35, -0.2))
                this.animator.play('fps_run')
            } else if (this.state.movement == 'walking' || this.state.movement == 'idle') {
                this.updateArmTransform()
                this.animator.play('fps_standard')
            }
        } else {
            if (this.state.throwing) return
            if (this.state.movement == 'running') this.state.movement = 'walking'
            const targetOffset = offsetValues.AK47.position; // Going to aiming position
            const targetRotation = offsetValues.AK47.rotation; // Aiming rotation
            this.updateArmTransform(targetOffset, targetRotation)
            this.animator.play('fps_standard')
        }
    }

    shoot() {
        if (this.gun.ammo <= 0) return
        if (this.gun.inCooldown || this.state.reloading || this.state.movement == 'running' || this.state.throwing) return
        this.gun.shoot()
        this.recoilAnimation()
        this.state.shooting = true

        userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)

        const interval = setInterval(() => {
            if (this.state.shooting === false || this.gun.ammo <= 0) {
                clearInterval(interval)
                return
            }
            this.gun.shoot()
            this.recoilAnimation()
            userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)
        }, this.gun.cooldownTime)
    }

    reload() {
        if (this.inventory.ammo == 0 || this.gun.ammo == this.gun.magSize) return
        if (this.state.throwing || this.state.reloading) return
        this.gun.reload(this.inventory)
        this.animator.play('reloading')
        this.state.reloading = true
        this.aim(false)
        setTimeout(() => {
            this.state.reloading = false
            userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)
        }, this.gun.reloadTime)
    }

    aim(aiming) {
        if (this.state.reloading && aiming === true) return
        this.state.aiming = aiming
        this.updateArmTransform()
    }

    throw() {
        if (this.state.throwing || this.state.reloading) return
        this.state.throwing = true
        this.updateArmTransform()
        this.animator.play('throwable')

        setTimeout(() => {
            if (!this.state.throwing) return
            this.gun.visible = false
            this.grenade.visible = true
            setTimeout(() => {
                this.animator.timeMultiplayer = 0

                const interval = setInterval(() => {
                    if (this.performThrow) {
                        this.animator.timeMultiplayer = 1
                        performThrow(this.camera, this.scene)
                        clearInterval(interval)
                        setTimeout(() => {
                            this.gun.visible = true
                            this.grenade.visible = false
                            this.state.throwing = false
                            this.performThrow = false
                        }, 1000)
                    }
                }, 100)
    
            }, 1000)
        }, 400)

        function performThrow(camera, scene) {
            setTimeout(() => {
                const lookdirection = new THREE.Vector3()
                camera.getWorldDirection(lookdirection)
                const grenade = new Grenade(10000, scene)
                grenade.position.copy(camera.position.clone())
                grenade.velocity.copy(lookdirection.clone().multiplyScalar(5))
                grenade.acceleration.y = -2
                entities.push(grenade)
                scene.add(grenade)
            }, 500)
        }
    }
    

    getForwardVector() {
        const vec = new THREE.Vector3();
        this.camera.getWorldDirection(vec);
        vec.y = 0;
        vec.normalize();
        return vec;
    }

    getSideVector() {
        const vec = new THREE.Vector3();
        this.camera.getWorldDirection(vec);
        vec.y = 0;
        vec.normalize();
        vec.cross(this.camera.up);
        return vec;
    }

    keydown(e) {
        const key = e.key.toLowerCase()

        switch (key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                this.inputs[key] = true
                break
            case 'r':
                this.reload()
                break;
            case 'g':
                this.throw()
                break;
            case ' ':
                if (this.onGround) {
                    this.velocity.y = 10
                    this.state.movement = 'jumping'
                }
                break;
        }
    }

    keyup(e) {
        const key = e.key.toLowerCase()
        switch (key) {
            case 'w':
            case 's':
            case 'd':
            case 'a':
                this.state.movement = 'idle'
                this.inputs[key] = false;
                break;
            case 'g':
                this.performThrow = true
                break;
        }
    }

    handleKeyDown(key) {
        switch (key) {
            case 'w':
                if (this.state.aiming) return
                this.state.movement = 'running'
                break;
            case 's':
                this.state.movement = 'walking'
                break;
            case 'd':
                this.state.movement = 'walking'
                break;
            case 'a':
                this.state.movement = 'walking'
                break;
        }
    }

    updateTransform() {
        this.model.position.copy(this.camera.position)
        this.model.rotation.copy(this.camera.rotation)
        this.model.updateMatrix()

        this.model.rotateX(this.rotate.x)
        this.model.rotateY(this.rotate.y + Math.PI)
        this.model.rotateZ(this.rotate.z)

        this.model.translateX(this.offset.x)
        this.model.translateY(this.offset.y)
        this.model.translateZ(this.offset.z)
        
        if (this.gun) this.gun.playerRotation = this.rotation
    }

    update(dt) {

        for (const key in this.inputs) {
            if (this.inputs[key]) {
                this.handleKeyDown(key)
            }
        }

        for (const attribute in this.state) {
            if (this.state[attribute] != this.lastState[attribute]) {
                this.onStateChange()
                this.lastState = Object.assign({}, this.state);
            }
        }


        const forwardVector = this.getForwardVector();
        const sideVector = this.getSideVector();

        this.currentSpeed = new THREE.Vector2(this.velocity.x, this.velocity.z).length()
    
        // Determine target speed based on inputs
        let targetSpeed = 0;
        if (
            this.inputs.w || 
            this.inputs.s || 
            this.inputs.a || 
            this.inputs.d
        ) {
            if (this.state.movement == 'running') {
                targetSpeed = this.maxSpeed * 1.5
            } else if (this.state.movement == 'walking') {
                targetSpeed = this.maxSpeed
            }
        }
    
        // Smooth acceleration towards target speed
        if (this.currentSpeed < targetSpeed) {
            this.currentSpeed += this.accelerationValue * dt; // Accelerate
            if (this.currentSpeed > targetSpeed) {
                this.currentSpeed = targetSpeed; // Clamp to max speed
            }
        } else if (this.currentSpeed > targetSpeed) {
            this.currentSpeed -= this.decelerationValue * dt; // Decelerate
            if (this.currentSpeed < 0) {
                this.currentSpeed = 0; // Clamp to zero speed
            }
        }
    
        // Calculate movement vector
        const moveVector = new THREE.Vector3();

        let scalar = {
            forward: 0,
            side: 0
        }

        
        if (this.inputs.w || this.inputs.s) {
            if (this.inputs.w) scalar.forward = 1
            if (this.inputs.s) scalar.forward = -1
        }
        if (this.inputs.a || this.inputs.d) {
            if (this.inputs.d) scalar.side = 1
            if (this.inputs.a) scalar.side = -1
        }
        moveVector.add(forwardVector.multiplyScalar(scalar.forward));
        moveVector.add(sideVector.multiplyScalar(scalar.side));
    
        // Normalize movement vector to avoid faster diagonal movement
        if (moveVector.length() > 1) {
            moveVector.normalize();
        }
    
        // Apply currentSpeed to the normalized moveVector
        moveVector.multiplyScalar(this.currentSpeed);
    
        // Apply the velocity based on movement vector
        this.velocity.x = moveVector.x;
        this.velocity.z = moveVector.z;

        if (this.animator) this.animator.update(dt)
    
        // Update position
        const position = this.position.clone().add(this.velocity.clone().multiplyScalar(dt));
        this.model.position.copy(position.clone().add(new THREE.Vector3(0, -0.9, 0)));
    
        // Update camera rotation and position
        this.rotation.copy(this.camera.rotation);
    
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection).normalize();
        const yrot = Math.atan2(cameraDirection.x, cameraDirection.z);
        this.model.rotation.y = yrot;
    
        super.update(dt);
        this.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, 0.7, 0)));
    
        this.updateTransform();
    }
    
}