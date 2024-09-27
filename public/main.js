import * as THREE from './imports/three.module.js'
import { Inputs } from './systems/inputs.js';
import { Physics } from './systems/physics.js';
import { Player } from './systems/player.js';
import { World } from './systems/world.js';
import { PointerLockControls } from './imports/PointerLockControls.js'
import { Loader } from './systems/model-loader.js';
import { Graphics } from './systems/graphics.js'
import { GLTFLoader } from './imports/GLTFLoader.js';
import { ParticleEffect } from './systems/particle-effect.js';

const socket = io()

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, 200);
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

export const inputs = new Inputs(camera, renderer)
export const loader = new Loader()

const graphics = new Graphics(scene)

const world = new World()
scene.add(world)

const player = new Player(camera, scene)
scene.add(player.model)
const physics = new Physics(world, player)

export const particles = new ParticleEffect(scene)

const controls = new PointerLockControls(camera, renderer.domElement)
inputs.registerHandler('mousedown', () => {
    controls.lock()
})

const testLoader = new GLTFLoader()


testLoader.load('models/buildings/house_2.glb', gltf => {
    const model = gltf.scene
    model.scale.setScalar(1)
    model.position.set(10, 0.52, 10)
    model.userData.type = 'map'

    scene.add(model)
})

export const entities = []



world.addPrism(0, 0, 0, 20, 1, 20)
world.addPrism(5, 1, 5, 1, 2, 2)
world.addPrism(6, 1, 6, 1, 3, 1)
world.addPrism(6, 1, 7, 1, 2, 1)
world.addPrism(6, 1, 8, 1, 3, 1)
world.addPrism(6, 1, 9, 1, 2, 1)

/*
world.renderBlock(1, 1, 1, 0.375, 0, 0, 0.25, 1, 1)
world.renderBlock(1, 1, 2, 0, 0, 0, 1, 1, 1)
*/


/* TO DO

gjør sånn at armene er et child av kameraet sånn at det følger dens rotasjon osv

*/


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

    renderer.render(scene, camera)
    previousTime = currentTime
}

animate()