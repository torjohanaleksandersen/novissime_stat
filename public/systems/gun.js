import * as THREE from '../imports/three.module.js'
import { GLTFLoader } from '../imports/GLTFLoader.js'
import { World } from './world.js'
import { particles } from '../main.js'


/* TO DO

1. Gjør koden mer clean og flytt over particle effects til fila dedikert for den (particles.js)
2. Reload


*/



const loader = new GLTFLoader()
export class Gun extends THREE.Group {
    constructor (scene, camera, leftarm) {
        super()
        this.scene = scene
        this.camera = camera
        this.leftarm = leftarm
        this.scale.setScalar(2000)
        this.position.set(-100, 500, 200)
        this.rotation.set(0.1, Math.PI, Math.PI / 2 - 0.07)

        this.playerRotation = new THREE.Euler()
        this.gunMagazine = new THREE.Object3D()

        loader.load('models/guns/AK47_.glb', gltf => {
            const model = gltf.scene
            this.add(model)
        })

        loader.load('models/guns/AK47_magazine.glb', gltf => {
            const model = gltf.scene
            this.gunMagazine = model
            this.add(model)
        })
        loader.load('models/guns/leftarm_magazine.glb', gltf => {
            const model = gltf.scene
            this.leftarmMagazine = model
            model.scale.setScalar(2000)
            model.rotation.set(Math.PI, 0, 0.4 + Math.PI)
            this.leftarm.add(model)
            model.visible = false
        })
    }

    matchPosition() {

        const magInGunWorldPosition = new THREE.Vector3()
        this.getWorldPosition(magInGunWorldPosition)
        const magInGunWorldQuaternion = new THREE.Quaternion().setFromEuler(this.playerRotation);
    
        const localMagPosition = new THREE.Vector3();
        const localMagQuaternion = new THREE.Quaternion();

        //x:-venstre y: +oppover z: -vekk fra kamera
        const offsetVector = new THREE.Vector3(-0.037, 0, -0.19);  // Example offset, 1 unit behind the camera

        // Apply camera's rotation to the offset vector to keep it relative to the camera's orientation
        const cameraRotation = new THREE.Quaternion();
        this.camera.getWorldQuaternion(cameraRotation);  // Get the camera's world rotation

        // Rotate the offset vector by the camera's quaternion to align it with the camera's current rotation
        offsetVector.applyQuaternion(cameraRotation);
    
        // Convert world position/rotation to local space
        this.leftarm.worldToLocal(localMagPosition.copy(magInGunWorldPosition.clone().add(offsetVector)));
        localMagQuaternion.copy(magInGunWorldQuaternion);
        localMagQuaternion.premultiply(this.leftarm.getWorldQuaternion(new THREE.Quaternion()).invert());
    
        // ADDITIONAL ROTATION:
        const additionalRotation = new THREE.Euler(0.02, Math.PI / 2 + 0.3, 0);  // Example: rotate 45 degrees on X-axis
        
        const additionalQuaternion = new THREE.Quaternion().setFromEuler(additionalRotation);
    
        // Apply the additional rotation after the current transformation
        localMagQuaternion.multiply(additionalQuaternion);
    
        // Apply final position and rotation to the magazine
        this.leftarmMagazine.position.copy(localMagPosition);
        this.leftarmMagazine.quaternion.copy(localMagQuaternion);
    }

    throwGrenade() {
        this.visible = false
        return
        setTimeout(() => {
            this.visible = true
        }, 3000)
    }

    reload() {
        setTimeout(() => {
            this.matchPosition()
            this.gunMagazine.visible = false
            this.leftarmMagazine.visible = true

            setTimeout(() => {
                this.gunMagazine.visible = true
                this.leftarmMagazine.visible = false
            }, 1200)
        }, 400)
    }
    

    shoot() {
        const position = this.camera.position.clone()
        const forwardVector = new THREE.Vector3()
        this.camera.getWorldDirection(forwardVector)
        particles.muzzleFlash(position, this)

        const ray = new THREE.Raycaster(position.clone(), forwardVector.clone(), 1, 100);
    

        const possibleTargets = []
        this.scene.children.forEach(child => {
            if (child instanceof World || child.userData.type == 'map') {
                possibleTargets.push(child)
            }
        })



        const result = ray.intersectObjects(possibleTargets);
        if (result.length > 0) {
            const target = result[0];

            particles.bulletWallCollision(target.point, target.normal)
        }
    }
}