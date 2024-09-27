import * as THREE from '../imports/three.module.js'
import { entities } from '../main.js'

export class Physics {
    constructor (world, player) {
        this.world = world
        this.player = player

        this.GRAVITY = 0.1

        this.simulationRate = 250
        this.stepSize = 1 / this.simulationRate
        this.accumulator = 0
    }

    update(dt) {
        this.accumulator += dt;
        while (this.accumulator >= this.stepSize) {
            entities.forEach(entity => {
                entity.update(this.stepSize)
                this.detectCollisions(entity);
            })
            this.player.update(this.stepSize)
            this.player.velocity.y -= this.GRAVITY
            this.detectCollisions(this.player);
            this.accumulator -= this.stepSize
        }
    }

    detectCollisions(entity) {
        entity.onGround = false
        const candidates = this.broadPhase(entity)
        if (candidates.length > 0) {
            const collisions = this.narrowPhase(entity, candidates)

            if (collisions.length > 0) {
                this.resolveCollisions(entity, collisions)
            }
        }
    }

    broadPhase(entity) {
        const candidates = [];

        const minX = Math.floor(entity.position.x - entity.radius);
        const maxX = Math.ceil(entity.position.x + entity.radius);
        const minY = Math.floor(entity.position.y - entity.height / 2);
        const maxY = Math.ceil(entity.position.y + entity.height / 2);
        const minZ = Math.floor(entity.position.z - entity.radius);
        const maxZ = Math.ceil(entity.position.z + entity.radius);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const data = this.world.getBlock(x, y, z);
                    if (data && data.id != 0) {      
                        const block = { 
                            x, 
                            y, 
                            z,
                            x_off: getPositionFromValue(data.x),
                            y_off: getPositionFromValue(data.y),
                            z_off: getPositionFromValue(data.z),
                            x_len: getLengthFromValue(data.x_len),
                            y_len: getLengthFromValue(data.y_len),
                            z_len: getLengthFromValue(data.z_len),
                        };
                        candidates.push(block);
                    }
                }
            }
        }

        return candidates;
    }

    narrowPhase(entity, candidates) {
        const collisions = [];

        for (const block of candidates) {
            const closestPoint = {
                x: Math.max(block.x + block.x_off - block.x_len/2, Math.min(entity.position.x, block.x + block.x_off + block.x_len/2)),
                y: Math.max(block.y + block.y_off - block.y_len/2, Math.min(entity.position.y, block.y + block.y_off + block.y_len/2)),
                z: Math.max(block.z + block.z_off - block.z_len/2, Math.min(entity.position.z, block.z + block.z_off + block.z_len/2))
            };

            const dx = closestPoint.x - entity.position.x;
            const dy = closestPoint.y - entity.position.y;
            const dz = closestPoint.z - entity.position.z;

            if (this.pointInEntityBoundingCylinder(entity, closestPoint)) {
                const overlapY = (entity.height / 2) - Math.abs(dy);
                const overlapXZ = entity.radius - Math.sqrt(dx * dx + dz * dz);

                let normal, overlap;
                if (overlapY < overlapXZ) {
                    normal = new THREE.Vector3(0, -Math.sign(dy), 0);
                    overlap = overlapY;
                    entity.onGround = true;
                } else {
                    normal = new THREE.Vector3(-dx, 0, -dz).normalize();
                    overlap = overlapXZ;
                }

                collisions.push({
                    block,
                    contactPoint: closestPoint,
                    normal,
                    overlap
                })
            }
        }

        return collisions;
    }

    resolveCollisions(entity, collisions) {
        collisions.sort((a, b) => a.overlap < b.overlap);
        

        for (const collision of collisions) {
            if (!this.pointInEntityBoundingCylinder(entity, collision.contactPoint)) continue;

            let deltaPosition = collision.normal.clone();
            deltaPosition.multiplyScalar(collision.overlap);
            entity.position.add(deltaPosition);

            let magnitude = entity.getWorldVelocity().dot(collision.normal);
            let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude);

            entity.applyWorldDeltaVelocity(velocityAdjustment.negate());
        }
    }

    pointInEntityBoundingCylinder(entity, p) {
        const dx = p.x - entity.position.x;
        const dy = p.y - entity.position.y;
        const dz = p.z - entity.position.z;
        const r_sq = dx * dx + dz * dz;

        return (Math.abs(dy) < entity.height / 2) && (r_sq < entity.radius * entity.radius);
    }
}

function getLengthFromValue(lenValue) {
    // Map 2-bit value to length (0.25, 0.5, 0.75, 1.0)
    switch (lenValue) {
        case 0: return 0.25;
        case 1: return 0.5;
        case 2: return 0.75;
        case 3: return 1.0;
    }
}

function getPositionFromValue(posValue) {
    // Map 2-bit value to position (0.125, 0.375, 0.625, 0.875)
    switch (posValue) {
        case 0: return 0;
        case 1: return -0.375;
        case 2: return 0.375;
        case 3: return 0;
    }
}