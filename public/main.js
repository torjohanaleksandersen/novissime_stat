import * as THREE from './imports/three.module.js'
import { Inputs } from './systems/inputs.js';
import { Player } from './systems/player.js';
import { PointerLockControls } from './imports/PointerLockControls.js'
import { Graphics } from './systems/graphics.js'
import { GLTFLoader } from './imports/GLTFLoader.js';
import { ParticleEffect } from './systems/particle-effect.js';
import { UserInterface } from './systems/user-interface.js';
import { Enemy } from './systems/enemy.js';
import { Network } from './systems/network.js';
import { Physics } from './systems/physics.js';
import { Audio } from './systems/audio.js';

const socket = io()

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, 200);
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const inputs = new Inputs(camera, renderer)
export const userInterface = new UserInterface()

const graphics = new Graphics(scene)

const player = new Player(camera, scene)
player.acceleration.y = -15
scene.add(player.model)

export const physics = new Physics(scene, player)

export const particles = new ParticleEffect(scene, camera)

const controls = new PointerLockControls(camera, renderer.domElement)
inputs.registerHandler('mousedown', () => {
    controls.pointerSpeed = 0.5
    controls.lock()
})

export const entities = []
export const enemies = new Map()
export const network = new Network(socket, enemies)

const listener = new THREE.AudioListener()
camera.add(listener)
export const audio = new Audio(listener)
audio.loadSound('rifle-single-2', 'audio/rifle-single-2.mp3')
audio.loadSound('rifle-reload-mag-out', 'audio/rifle-reload-mag-out.mp3')
audio.loadSound('rifle-reload-mag-in', 'audio/rifle-reload-mag-in.mp3')
audio.loadSound('casing-hitting-ground', 'audio/casing-hitting-ground.mp3')
audio.loadSound('stun-grenade', 'audio/stun-grenade.mp3', true)
audio.loadSound('frag-grenade', 'audio/frag-grenade.mp3', true)

const loader = new GLTFLoader()

socket.on('game-state-update', data => {
    data.forEach(packet => {
        const [id, position, rotation, yrot, state] = packet

        if (!enemies.has(id)) {
            enemies.set(id, 'loading')
            loader.load('models/characters/Entente.character.glb', (gltf) => {
                const model = gltf.scene
                model.scale.setScalar(0.01)
                model.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.frustumCulled = false
                        if (obj.material) {
                            obj.material.roughness = 1
                            obj.material.needsUpdate = true
                        }
                    }
                })
                const enemy = new Enemy(model, scene, player.height, player.radius)
                enemy.mesh.userData.objectType = 'enemy'
                enemy.mesh.userData.id = id
                enemies.set(id, enemy)
                scene.add(enemy.mesh)
            })
        } else {
            const enemy = enemies.get(id)
            if (enemy == 'loading') return
            const mesh = enemy.mesh
            enemy.rotation.set(...rotation)
            enemy.interpolatePositions(position)
            enemy.interpolateRotations(yrot)

            enemy.updateState(state)
        }
    })

    socket.emit('player-state-update', [vectorToArray(player.position), vectorToArray(player.model.rotation), player.yrot, player.state])
})

socket.on('player-hit-confirmed', (data) => {
    const [id, position] = data
    particles.bloodEffect(new THREE.Vector3(...position))
})

socket.on('youre-hit', (health) => {
    player.health = health
    userInterface.updateHealth(health)
})

socket.on('youre-dead', () => {
    player.state.dead = true
    userInterface.updateHealth(0)
    player.animator.play('death')

    setTimeout(() => {
        player.health = 100
        player.state.dead = false
    }, 3000)
})

socket.on('player-disconnected', (id) => {
    scene.remove(enemies.get(id).mesh)
    enemies.delete(id)
})





function vectorToArray(vec) {
    return [vec.x, vec.y, vec.z]
}


let previousTime = performance.now()
function animate() {
    requestAnimationFrame(animate)

    const currentTime = performance.now();
    const dt = (currentTime - previousTime) / 1000;


    physics.update(dt)
    graphics.update()
    particles.update(dt)

    entities.forEach(entity => {
        entity.update(dt)
        if (entity.timeToLive <= 0) {
            entities.splice(entities.indexOf(entity), 1)
        }
    })

    enemies.forEach(enemy => {
        if (enemy == 'loading') return
        enemy.update(dt)
    })

    renderer.render(scene, camera)
    previousTime = currentTime
}

animate()