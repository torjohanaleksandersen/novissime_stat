import * as THREE from '../imports/three.module.js'
import { Entity } from '../components/entity.js'
import { audio, entities, physics, userInterface } from '../main.js'
import { RigidBody } from '../components/rigid-body.js'


export class ParticleEffect {
    constructor (scene, camera) {
        this.scene = scene
        this.camera = camera

        this.entities = []
        this.grenadeParticles = []
        this.bulletMarkParticles = []
    }

    bloodEffect(position) {
        for (let i = 0; i < 20; i++) {
            const color = Math.random() * 0.3
            function scale() {
                return 0.01 + Math.random() * 0.05
            }
            const geometry = new THREE.BoxGeometry(scale(), scale(), scale())
            const material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(color, 0, 0),
                transparent: true,
                opacity: Math.random() * 0.2 + 0.5
            })
            const mesh = new THREE.Mesh(geometry, material)

            function rotation() {
                return Math.random() * Math.PI * 2
            }
            mesh.rotation.set(rotation(), rotation(), rotation())

            const entity = new Entity()
            entity.mesh = mesh

            function positionOffset() {
                return Math.random() * 0.1 - 0.05
            }

            entity.position.copy(position.clone().add(new THREE.Vector3(positionOffset(), positionOffset(), positionOffset())))
            entity.velocity.set(Math.random() * 0.4, 0, Math.random() * 0.4)
            entity.acceleration.set(0, -2, 0)

            this.scene.add(mesh)
            this.entities.push(entity)

            const dt = 10, time = 10000
            let t = 0

            const interval = setInterval(() => {
                if (t >= time) {
                    this.entities.splice(this.entities.indexOf(entity), 1)
                    this.scene.remove(mesh)
                    clearInterval(interval)
                }
                const progress = t / time
                const opacityDistance = mesh.material.opacity

                t += dt

                mesh.material.opacity -= opacityDistance * progress
            }, dt)
        }
    }

    bulletWallCollision(position) {
        for (let i = 0; i < 5; i++) {
            const n = Math.random() * 0.2
            function w() {
                return 0.01 + Math.random() * 0.1
            }
            const geometry = new THREE.BoxGeometry(w(), w(), w())
            const material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(n, n, n),
                transparent: true,
                opacity: 1,
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
            entity.velocity.set(Math.random() * 0.5, Math.random() * 0.5 - 0.2, Math.random() * 0.5)
            entity.acceleration.set(0, -2, 0)

            this.scene.add(mesh)
            this.entities.push(entity)

            const time = 5000, dt = 10
            let t = 0
            const interval = setInterval(() => {
                if (t >= time) {
                    clearInterval(interval)
                    this.entities.splice(this.entities.indexOf(entity), 1)
                    this.scene.remove(mesh)
                    return
                }

                const progress = t / time
                const opacityDistance = mesh.material.opacity

                mesh.material.opacity -= opacityDistance * progress
                t += dt
            }, dt)
        }

        const width = 0.05 + Math.random() * 0.05;
        const geometry = new THREE.BoxGeometry(width, 0.01, width);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: Math.random() * 0.3 + 0.6,
            transparent: true
        });
        const bulletMark = new THREE.Mesh(geometry, material);

        bulletMark.position.copy(position);
        this.scene.add(bulletMark);

        this.bulletMarkParticles.push(bulletMark)


        setTimeout(() => {
            this.scene.remove(bulletMark)
            this.bulletMarkParticles.splice(this.bulletMarkParticles.indexOf(bulletMark), 1)
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

        const lightPosition = group.position.clone().add(new THREE.Vector3(-0.2, -4, 0))
        const light = new THREE.PointLight(new THREE.Color(1, 1, 1), 10)
        light.position.copy(lightPosition.clone())
        group.add(light)
        setTimeout(() => {
            group.remove(light)
        }, 20)
        
        
        let dt = 20, t0 = 0, t = 500
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

    grenadeExplosion(position) {
        function newParticle() {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
            const material = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true})
            const mesh = new THREE.Mesh(geometry, material)
            return mesh
        }
        for (let i = 0; i < 100; i++) {
            const mesh = newParticle()
            mesh.scale.setScalar(Math.random() * 1 + 0.5)

            
            const particle = new Entity()
            particle.add(mesh)
            particle.timeToLive = 4000
            const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() + 0.5, Math.random() * 2 - 1).multiplyScalar(0.1)
            particle.position.copy(position.clone())
            particle.velocity.copy(direction.clone().multiplyScalar(Math.random() * 100 + 2))
            particle.acceleration.y = -1
            mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)

            

            particle.userData.s0 = particle.position.clone()
            particle.userData.t0 = 0
            particle.userData.randomColorOffset = Math.random() * 0.1
            if (Math.random() < 0.3) {
                particle.userData.type = 'gray'
            } else {
                particle.userData.type = 'yellow'
            }
            
            entities.push(particle)
            this.grenadeParticles.push(particle)

            this.scene.add(particle)
            

            
            /*
            const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() + 0.5, Math.random() * 2 - 1).multiplyScalar(0.1)
            const velocity = direction.clone().multiplyScalar(Math.random() * 100 + 2)

            const rigidBody = new RigidBody(position.clone().add(new THREE.Vector3(0, 0.5, 0)), velocity.clone(), 0, mesh.geometry.parameters.height / 2 * mesh.scale.y, mesh)
            rigidBody.timeToLive = 3000
            rigidBody.dampingScale = 2
            physics.addRigidBody(rigidBody)
            this.scene.add(rigidBody)
            
            
            setTimeout(() => {
                physics.removeRigidBody(rigidBody)
                this.scene.remove(rigidBody)
            }, rigidBody.timeToLive)
            */

            
        }
    }

    stunGrenadeExplosion(position) {
        audio.playPositionalAudio('stun-grenade', position.x, position.y, position.z)
        userInterface.stunGrenadeEffect()
    }

    updateGrenadeParticles(dt) {
        this.grenadeParticles.forEach(particle => {
            if (particle.timeToLive <= 0) {
                this.grenadeParticles.splice(this.grenadeParticles.indexOf(particle), 1)
                this.scene.remove(particle)
            }
            particle.timeToLive -= dt * 1000
            const distance = particle.position.clone().sub(particle.userData.s0.clone()).length()
            const maxDistance = 10
            let percent = distance / maxDistance + particle.userData.t0
            if (percent > 1) percent = 1

            particle.userData.t0 += dt

            const r = particle.userData.randomColorOffset
            function rgb(t) {
                t = Math.max(0, Math.min(1, t));
                let red, green, blue;
            
                if (t <= 0.3) {
                    // Transition from White to Orange
                    red = 1;
                    green = 1 - 2 * t;  // Decrease green
                    blue = 1 - 2 * t;   // Decrease blue
                } else if (t <= 0.6) {
                    // Transition from Orange to Red
                    red = 1;
                    green = (1 - t) * 0.647; // Interpolating green
                    blue = 0; // Blue stays 0
                } else {
                    red = 1 - t;
                    green = 1 - t;
                    blue = 1 - t
                }
            
                return new THREE.Color(red, green, blue);
            }


            const mesh = particle.children[0]
            if (particle.userData.type == 'gray') {
                mesh.material.color = new THREE.Color(0.5 - percent * 0.5 + r, 0.5 - percent * 0.5 + r, 0.5 - percent * 0.5 + r)
                mesh.material.opacity = (1 - percent) * (1 + r * 500)
            } else {
                mesh.material.color = rgb(percent)
                mesh.material.opacity = (1 - percent) * (1 + r * 500)
            }

        })
    }

    update(dt) {
        this.entities.forEach(entity => {
            entity.update(dt)
        })

        this.bulletMarkParticles.forEach(particle => {
            particle.lookAt(this.camera.position.clone())
            particle.rotateX(Math.PI / 2)
        })

        this.updateGrenadeParticles(dt)
    }
}