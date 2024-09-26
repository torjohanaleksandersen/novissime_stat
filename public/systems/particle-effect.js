import * as THREE from '../imports/three.module.js'
import { Entity } from '../components/entity.js'


export class ParticleEffect {
    constructor (scene) {
        this.scene = scene

        this.entities = []
    }

    bulletWallCollision(position, normal) {
        for (let i = 0; i < 5; i++) {
            const n = Math.random() * 0.2
            function w() {
                return 0.1 + Math.random() * 0.1
            }
            const geometry = new THREE.BoxGeometry(w(), w(), w())
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(n, n, n),
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotation.set(
                Math.random() * Math.PI * 2, 
                Math.random() * Math.PI * 2, 
                Math.random() * Math.PI * 2
            )

            const entity = new Entity()
            entity.mesh = mesh
            entity.position.copy(position)
            entity.velocity.set(Math.random(), 2, Math.random())
            entity.acceleration.set(0, -10, 0)

            this.scene.add(mesh)
            this.entities.push(entity)
            
            setTimeout(() => {
                this.entities.splice(this.entities.indexOf(entity), 1)
                this.scene.remove(mesh)
            }, 2000)
        }

        const width = 0.05 + Math.random() * 0.05;
        const geometry = new THREE.BoxGeometry(width, 0.01, width);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: Math.random() * 0.3 + 0.6,
            transparent: true
        });
        const bulletMark = new THREE.Mesh(geometry, material);

        // Set position to the intersection point
        bulletMark.position.copy(position);

        const upVector = new THREE.Vector3(0, 1, 0); // Define the up vector

        // Calculate the rotation needed to align the bullet mark
        const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, normal);
        bulletMark.quaternion.multiplyQuaternions(quaternion, bulletMark.quaternion); // Apply rotation

        const randomAngle = Math.random() * Math.PI * 2; // Random angle between 0 and 2π

        // Create a rotation quaternion around the normal
        const rotationAroundNormal = new THREE.Quaternion().setFromAxisAngle(normal, randomAngle);
        
        // Apply the additional random rotation
        bulletMark.quaternion.multiplyQuaternions(rotationAroundNormal, bulletMark.quaternion);
        this.scene.add(bulletMark);


        setTimeout(() => {
            this.scene.remove(bulletMark)
        }, 5000)
    }

    muzzleFlash(position, parent) {
        const maxDistance = 4
        const group = new THREE.Group()
        group.rotation.set(-0.1, -Math.PI, - Math.PI / 2 - 0.07)
        parent.add(group)
        const cubes = []

        function cube(offset) {
            const start = new THREE.Vector3(-0.45, -4, -0.06)
            const k = Math.abs(offset.y) / maxDistance
            function rgb(t) {
                t = Math.max(0, Math.min(1, t));
                let red, green, blue;
            
                if (t <= 0.5) {
                    // Transition from White to Orange
                    red = 1;
                    green = 1 - 2 * t;  // Decrease green
                    blue = 1 - 2 * t;   // Decrease blue
                } else {
                    // Transition from Orange to Red
                    red = 1;
                    green = (1 - t) * 0.647; // Interpolating green
                    blue = 0; // Blue stays 0
                }
            
                return new THREE.Color(red, green, blue);
            }

            const geometry = new THREE.BoxGeometry(0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4, 0.2 + Math.random() * 0.4)
            const material = new THREE.MeshBasicMaterial({
                color: rgb(k),
                transparent: true,
                opacity: Math.random() * 0.6 + 0.3
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )

            mesh.position.copy(offset).add(start.clone())
            cubes.push(mesh)
            return mesh
        }

        const d = 0.2
        group.add(cube(new THREE.Vector3(d, -Math.random() * 0.4, 0)))
        group.add(cube(new THREE.Vector3(-d, -Math.random() * 0.4, 0)))
        group.add(cube(new THREE.Vector3(0, -Math.random() * 0.4, -d)))
        group.add(cube(new THREE.Vector3(0, -Math.random() * 0.4, d)))

        group.add(cube(new THREE.Vector3(d * 0.3, -Math.random() - 1, 0)))
        group.add(cube(new THREE.Vector3(-d * 0.3, -Math.random() - 1, 0)))
        group.add(cube(new THREE.Vector3(0, -Math.random() - 1, -d * 0.3)))
        group.add(cube(new THREE.Vector3(0, -Math.random() - 1, d * 0.3)))

        group.add(cube(new THREE.Vector3(0, -Math.random() * 2 - 2, 0)))
        group.add(cube(new THREE.Vector3(0, -Math.random() * 2 - 2, 0)))

        const light = new THREE.PointLight(new THREE.Color(1, 1, 1), 50)
        light.position.copy(position)
        group.add(light)
        setTimeout(() => {
            group.remove(light)
        }, 20)
        
        
        let dt = 1, t0 = 0, t = 3000
        const interval = setInterval(() => {
            t0 += dt

            cubes.forEach(cube => {
                const opacity = cube.material.opacity
                cube.material.opacity = opacity * ((t - t0) / t)
            })

            if (t0 >= t) {
                cubes.forEach(cube => {
                    group.remove(cube)
                })
                cubes.length = 0
                clearInterval(interval)
            }
        }, dt)
    }

    update(dt) {
        this.entities.forEach(entity => {
            entity.update(dt)
        })
    }
}