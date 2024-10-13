import { Entity } from "../components/entity.js";
import * as THREE from '../imports/three.module.js'
import { audio, entities, inputs, network, particles, physics, userInterface } from "../main.js";
import { Animator } from "./animator.js";
import { GLTFLoader } from "../imports/GLTFLoader.js";
import { Gun } from "./gun.js";
import { offsetValues } from "../data/offset_values.js";
import { Grenade, StunGrenade } from "./throwables.js";
import { Capsule } from "../imports/Capsule.js";
import { RigidBody } from "../components/rigid-body.js";


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

        this.height = 1.2
        this.radius = 0.3

        this.position.set(9, 3.6, 9);
        this.collider = new Capsule(
            this.position.clone().sub(new THREE.Vector3(0, this.height / 2, 0)),
            this.position.clone().add(new THREE.Vector3(0, this.height / 2, 0)),
            this.radius
        );

        
        this.inputs = {
            w: false,
            s: false,
            a: false,
            d: false
        }
        
        this.performThrow = false

        this.inventory = {
            ammo: 1000
        }

        this.grenades = {}

        
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

                    userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)


                    const grenade = new Grenade().clone()
                    this.grenades['frag-grenade'] = grenade
                    grenade.scale.setScalar(7)
                    grenade.position.z = 300
                    grenade.rotation.y = 2
                    grenade.visible = false
                    bone.add(grenade)

                    const stunGrenade = new StunGrenade().clone()
                    this.grenades['stun-grenade'] = stunGrenade
                    stunGrenade.scale.setScalar(7)
                    stunGrenade.position.z = 300
                    stunGrenade.rotation.y = 2
                    stunGrenade.visible = false
                    bone.add(stunGrenade)
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
            throwing: false,
            dead: false
        }
        this.lastState = Object.assign({}, this.state);

        this.health = 100

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
                    this.camera.rotateX(factor * 1.5 * recoil(time).x / maxTime)
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
        if (this.gun.ammo <= 0) {
            this.state.shooting = false
            return
        }
        if (this.gun.inCooldown || this.state.reloading || this.state.movement == 'running' || this.state.throwing) return
        this.gun.shoot()
        this.recoilAnimation()
        this.state.shooting = true

        userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)
        audio.play('rifle-single-2')

        const interval = setInterval(() => {
            if (this.state.shooting === false || this.gun.ammo <= 0) {
                clearInterval(interval)
                return
            }
            this.gun.shoot()
            this.recoilAnimation()
            userInterface.updateAmmo(this.gun.ammo, this.inventory.ammo)
            audio.play('rifle-single-2')
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

    throw(type) {
        if (this.state.throwing || this.state.reloading) return
        this.state.throwing = true
        this.updateArmTransform()
        this.animator.play('throwable')

        setTimeout(() => {
            if (!this.state.throwing) return
            this.gun.visible = false
            this.grenades[type].visible = true
            setTimeout(() => {
                this.animator.timeMultiplayer = 0

                const interval = setInterval(() => {
                    if (this.performThrow) {
                        this.animator.timeMultiplayer = 1
                        performThrow(this.camera, this.scene, type)
                        clearInterval(interval)
                        setTimeout(() => {
                            this.gun.visible = true
                            this.grenades[type].visible = false
                            this.state.throwing = false
                            this.performThrow = false
                        }, 1000)
                    }
                }, 100)
    
            }, 1000)
        }, 400)

        function performThrow(camera, scene, type) {
            let model = null
            if (type == 'stun-grenade') model = new StunGrenade().clone()
            if (type == 'frag-grenade') model = new Grenade().clone()
            setTimeout(() => {
                const lookdirection = new THREE.Vector3()
                camera.getWorldDirection(lookdirection)

                model.scale.setScalar(model.throwingState.scale)
                const rigidBody = new RigidBody(camera.position.clone(), lookdirection.clone().multiplyScalar(15), 0, 0.05, model)
                scene.add(rigidBody)
                physics.addRigidBody(rigidBody)

                setTimeout(() => {
                    model.explode(rigidBody.position.clone())
                    scene.remove(rigidBody)
                }, 5000)
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
                this.throw('frag-grenade')
                network.sendPacketToServer('start-throw')
                break;
            case 't':
                this.throw('stun-grenade')
                network.sendPacketToServer('start-throw')
                break
            case 'f': 
                break;
            case ' ':
                if (this.onGround) {
                    //this.velocity.y = 4
                    this.state.movement = 'jumping'
                    setTimeout(() => {
                        this.state.movement = 'idle'
                    }, 100)
                }
                break;
            case 'f':
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
            case 't':
                this.performThrow = true
                const lookdirection = new THREE.Vector3()
                this.camera.getWorldDirection(lookdirection)
                network.sendPacketToServer('perform-throw', [lookdirection.x, lookdirection.y, lookdirection.z])
                break;
        }
    }

    handleKeyDown(key) {
        switch (key) {
            case 'w':
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
        this.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, 0.7, 0)));
    
        this.position.copy(this.collider.start.clone().add(new THREE.Vector3(0, this.height / 2, 0)))
        

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
        this.yrot = yrot
    
        this.updateTransform();
    }
    
}