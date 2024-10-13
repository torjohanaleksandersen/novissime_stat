import * as THREE from '../imports/three.module.js'
import { GLTFLoader } from "../imports/GLTFLoader.js";
import { Octree } from '../imports/Octree.js'
import { entities, inputs } from '../main.js';
import { Capsule } from '../imports/Capsule.js';
import { RigidBody } from '../components/rigid-body.js';


export class Physics {
    constructor (scene, player) {
        this.scene = scene
        this.player = player

        this.GRAVITY = 30
        this.octree = new Octree()

        this.keys = {}
        inputs.registerHandler('keydown', (e) => {this.keys[e.key.toLowerCase()] = true})
        inputs.registerHandler('keyup', (e) => {this.keys[e.key.toLowerCase()] = false})

        this.entities = []
    
        this.initialized = false
        this.waitingToStart = false
        this.loadMap()
    }

    addMesh(mesh) {
        this.octree.fromGraphNode(mesh)
    }

    playerCollisions() {
        const result = this.octree.capsuleIntersect( this.player.collider );
    
        this.player.onGround = false;
    
        if ( result ) {
            this.player.onGround = result.normal.y > 0;
    
            if ( ! this.player.onGround ) {
                this.player.velocity.addScaledVector( result.normal, - result.normal.dot( this.player.velocity.clone() ) );
            }
    
            if ( result.depth >= 1e-10 ) {
                this.player.collider.translate( result.normal.multiplyScalar( result.depth ) );
            }
        }
    }

    updatePlayer( deltaTime ) {
        let damping = Math.exp( - 4 * deltaTime ) - 1;
    
        if ( ! this.player.onGround ) {
            this.player.velocity.y -= this.GRAVITY * deltaTime;
            damping *= 0.1;
        } else if (this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d']) {
            // Reset damping when moving
            damping *= 0.5; // Reduce speed less while moving
        } else {
            // Apply more damping when no keys are pressed to stop faster
            damping *= 5.0; // Increase this value for faster stopping
        }
    
        this.player.velocity.addScaledVector( this.player.velocity.clone().multiplyScalar(2), damping );
    
        const deltaPosition = this.player.velocity.clone().multiplyScalar( deltaTime );
        this.player.collider.translate( deltaPosition );
    
        this.playerCollisions();
    }

    controls( deltaTime ) {
        const speedDelta = deltaTime * ( this.player.onGround ? 15 : 1 );
    
        if ( this.keys[ 'w' ] ) {
            this.player.velocity.add( this.player.getForwardVector().multiplyScalar( speedDelta ) );
        }
    
        if ( this.keys[ 's' ] ) {
            this.player.velocity.add( this.player.getForwardVector().multiplyScalar( - speedDelta ) );
        }
    
        if ( this.keys[ 'a' ] ) {
            this.player.velocity.add( this.player.getSideVector().multiplyScalar( - speedDelta ) );
        }
    
        if ( this.keys[ 'd' ] ) {
            this.player.velocity.add( this.player.getSideVector().multiplyScalar( speedDelta ) );
        }
    
        if ( this.player.onGround ) {
            if ( this.keys[ ' ' ] ) {
                this.player.velocity.y = 5;
            }
        }
    }

    loadMap() {
        const loader = new GLTFLoader();
        loader.load('models/buildings/red_house.glb', gltf => {
            const model = gltf.scene
            model.scale.setScalar(0.75)
            model.position.set(5.8, 0.15, 6.45)
            model.userData.type = 'map'
            model.traverse(obj => {
                if (obj.isMesh) {
                    obj.castShadow = true
                    obj.recieveShadow = true
                    obj.material.side = THREE.DoubleSide
                    obj.material.flatShading = true; // Flattens the shading for better results on both sides
                    obj.material.needsUpdate = true; // Ensure the material updates
                    if (obj.geometry) {
                        obj.geometry = makeGeometryCollidableFromBothSides(obj.geometry);
                    }
                }
            })
            this.octree.fromGraphNode(model)
            this.scene.add(model)
            this.initialized = true
        })
    }

    entityCollisions(entity) {
        const result = this.octree.capsuleIntersect( entity.collider );
    
        entity.onGround = false;
    
        if ( result ) {
            entity.onGround = result.normal.y > 0;
    
            if ( ! entity.onGround ) {
                entity.velocity.addScaledVector( result.normal, - result.normal.dot( entity.velocity.clone() ) );
            }
    
            if ( result.depth >= 1e-10 ) {
                entity.collider.translate( result.normal.multiplyScalar( result.depth ) );
            }
        }
    }

    updateEntities(deltaTime) {
        let damping = Math.exp( - 4 * deltaTime ) - 1;
        this.entities.forEach(entity => {
            if (entity.timeToLive <= 0) {
                this.entities.splice(this.entities.indexOf(entity), 1)
            }
            entity.timeToLive -= deltaTime
            if ( ! entity.onGround ) {
                entity.velocity.y -= this.GRAVITY * 0.3 * deltaTime;
                damping *= 0.1;
            }
            damping *= entity.dampingScale
        
            entity.velocity.addScaledVector( entity.velocity.clone(), damping );
        
            const deltaPosition = entity.velocity.clone().multiplyScalar( deltaTime );
            entity.collider.translate( deltaPosition );
            entity.position.copy(entity.collider.start.clone())
    

            this.entityCollisions(entity);
        })
    }
    
    addRigidBody(rigidBody) {
        this.entities.push(rigidBody)
    }

    removeRigidBody(rigidBody) {
        this.entities.splice(this.entities.indexOf(rigidBody), 1)
    }

    update(dt) {
        this.player.update(dt)
        if (!this.initialized || this.waitingToStart == true) return
        const STEPS_PER_FRAME = 10
        const deltaTime = dt / STEPS_PER_FRAME
        for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
            this.controls( deltaTime );
            this.updatePlayer( deltaTime );

            this.updateEntities(deltaTime)
        }
    }
}


function makeGeometryCollidableFromBothSides(geometry) {
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv'); // Preserve UVs for materials
    const indexAttribute = geometry.getIndex();

    const vertices = [];
    const indices = [];
    const normals = []; // New normals
    const uvs = []; // Store UVs

    if (indexAttribute !== null) {
        // If the geometry is indexed, use the index attribute to get the vertex indices
        for (let i = 0; i < indexAttribute.count; i += 3) {
            const a = indexAttribute.getX(i);
            const b = indexAttribute.getX(i + 1);
            const c = indexAttribute.getX(i + 2);

            // Add original triangle
            indices.push(a, b, c);

            // Add flipped triangle for double-sided effect
            indices.push(c, b, a); // Flip order to reverse the winding (normal direction)
        }
    } else {
        // If geometry is not indexed, add faces directly from position attribute
        for (let i = 0; i < positionAttribute.count; i += 3) {
            const a = i;
            const b = i + 1;
            const c = i + 2;

            // Add original triangle
            indices.push(a, b, c);

            // Add flipped triangle for double-sided effect
            indices.push(c, b, a); // Flip order to reverse the winding (normal direction)
        }
    }

    // Create new geometry with double-sided faces
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', positionAttribute);
    
    if (uvAttribute) {
        newGeometry.setAttribute('uv', uvAttribute); // Preserve UVs
    }

    newGeometry.setIndex(indices);

    // Force recalculating vertex normals
    newGeometry.computeVertexNormals();

    return newGeometry;
}
