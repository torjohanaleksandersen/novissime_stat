import * as THREE from '../imports/three.module.js'



export class World extends THREE.Object3D {
    constructor () {
        super()

        const width = 20, height = 20, depth = 20;
        this.blocks = new Array(width).fill(0).map(() =>
            new Array(height).fill(0).map(() => new Array(depth).fill(0))
        );
    }

    renderBlock(x, y, z, x_off, y_off, z_off, x_len, y_len, z_len) {
        const geometry = new THREE.BoxGeometry( x_len, y_len, z_len );
        const material = new THREE.MeshLambertMaterial( { color: 0x00ffff } );
        const mesh = new THREE.Mesh( geometry, material );
        
        const position = new THREE.Vector3(
            x + x_off,
            y + y_off,
            z + z_off
        )
        mesh.position.copy(position)
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.add(mesh)
        this.setBlock(1, x, y, z, x_len, y_len, z_len, x_off, y_off, z_off)
    }

    addPrism(x, y, z, a, b, c) {
        const geometry = new THREE.BoxGeometry( a, b, c );
        const material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
        const mesh = new THREE.Mesh( geometry, material );
        const position = new THREE.Vector3(x + a/2 - 1/2, y + b/2 - 1/2, z + c/2 - 1/2)
        mesh.position.copy(position)
        mesh.receiveShadow = true
        mesh.castShadow = true

        for (let _x = x; _x < x + a; _x ++) {
            for (let _y = y; _y < y + b; _y++) {
                for (let _z = z; _z < z + c; _z++) {
                    this.setBlock(1, _x, _y, _z, 1, 1, 1, 0, 0, 0)
                }
            }
        }

        this.add(mesh)
    }

    getBlock(x, y, z) {
        if (!this.blocks[x] || !this.blocks[x][y] || !this.blocks[x][y][z]) return null
        return unpackBlockData(this.blocks[x][y][z])
    }

    setBlock(id, x, y, z, x_len, y_len, z_len, x_off, y_off, z_off) {
        this.blocks[x][y][z] = packBlockData(
            id, 
            getValueFromLength(x_len), 
            getValueFromLength(y_len), 
            getValueFromLength(z_len), 
            getValueFromPosition(x_off), 
            getValueFromPosition(y_off), 
            getValueFromPosition(z_off)
        )
    }
}

function packBlockData(id, x_len, y_len, z_len, x, y, z) {
    let packedData = 0;

    // Set solidity (bit 0)
    packedData |= (id & 1);  // Solidity is 1 bit

    // Shift and store x_len (bits 1-2)
    packedData |= (x_len & 3) << 1;

    // Shift and store y_len (bits 3-4)
    packedData |= (y_len & 3) << 3;

    // Shift and store z_len (bits 5-6)
    packedData |= (z_len & 3) << 5;

    // Shift and store x position (bits 7-8)
    packedData |= (x & 3) << 7;

    // Shift and store y position (bits 9-10)
    packedData |= (y & 3) << 9;

    // Shift and store z position (bits 11-12)
    packedData |= (z & 3) << 11;

    return packedData;
}

function unpackBlockData(packedData) {
    // Extract solidity (bit 0)
    let id = packedData & 1;

    // Extract x_len (bits 1-2)
    let x_len = (packedData >> 1) & 3;

    // Extract y_len (bits 3-4)
    let y_len = (packedData >> 3) & 3;

    // Extract z_len (bits 5-6)
    let z_len = (packedData >> 5) & 3;

    // Extract x position (bits 7-8)
    let x = (packedData >> 7) & 3;

    // Extract y position (bits 9-10)
    let y = (packedData >> 9) & 3;

    // Extract z position (bits 11-12)
    let z = (packedData >> 11) & 3;

    return { id, x_len, y_len, z_len, x, y, z };
}

function getValueFromLength(value) {
    // Map 2-bit value to length (0.25, 0.5, 0.75, 1.0)
    switch (value) {
        case 0.25: return 0;
        case 0.5: return 1;
        case 0.75: return 2;
        case 1.0: return 3;
    }
}

function getValueFromPosition(value) {
    // Map 2-bit value to position (0.125, 0.375, 0.625, 0.875)
    switch (value) {
        case 0: return 0;
        case -0.375: return 1;
        case 0.375: return 2;
        case 0: return 3;
    }
}