// Import Three.js and OrbitControls
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/PointerLockControls.js';
import { BufferGeometryUtils } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/utils/BufferGeometryUtils.js';
import { makeNoise2D } from 'https://cdn.jsdelivr.net/npm/open-simplex-noise@2.5.0/lib/mod.min.js';

// --- BASIC SETUP ---
// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// --- GAME CONFIGURATION ---
const CHUNK_SIZE = { x: 16, y: 256, z: 16 };
const BLOCK_SIZE = 1;

// --- BLOCK TYPES ---
const blockTypes = {
    air: {
        id: 0,
        color: 0x000000,
        isSolid: false
    },
    grass: {
        id: 1,
        color: 0x00ff00,
        isSolid: true
    },
    dirt: {
        id: 2,
        color: 0x8b4513,
        isSolid: true
    },
    stone: {
        id: 3,
        color: 0x808080,
        isSolid: true
    }
};

// --- CHUNK CLASS ---
class Chunk {
    constructor(scene, world, chunkX, chunkZ) {
        this.scene = scene;
        this.world = world;
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.size = CHUNK_SIZE;
        this.blocks = new Uint8Array(this.size.x * this.size.y * this.size.z);
        this.mesh = null;

        this._initializeBlocks();
        this.generateMesh();
    }

    _getBlockIndex(x, y, z) {
        return y * (this.size.x * this.size.z) + z * this.size.x + x;
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= this.size.x || y < 0 || y >= this.size.y || z < 0 || z >= this.size.z) {
            return { id: blockTypes.air.id, isSolid: false }; // Return air block object
        }
        const blockId = this.blocks[this._getBlockIndex(x, y, z)];
        return Object.values(blockTypes).find(type => type.id === blockId);
    }

    setBlock(x, y, z, typeId) {
        this.blocks[this._getBlockIndex(x, y, z)] = typeId;
    }

    _initializeBlocks() {
        const noise2D = this.world.noise2D;
        for (let x = 0; x < this.size.x; x++) {
            for (let z = 0; z < this.size.z; z++) {
                const globalX = this.chunkX * this.size.x + x;
                const globalZ = this.chunkZ * this.size.z + z;
                const height = Math.floor(noise2D(globalX / 50, globalZ / 50) * 10) + 128;
                for (let y = 0; y < this.size.y; y++) {
                    let blockId;
                    if (y > height) {
                        blockId = blockTypes.air.id;
                    } else if (y === height) {
                        blockId = blockTypes.grass.id;
                    } else if (y > height - 5) {
                        blockId = blockTypes.dirt.id;
                    } else {
                        blockId = blockTypes.stone.id;
                    }
                    this.setBlock(x, y, z, blockId);
                }
            }
        }
    }

    generateMesh() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            // Properly dispose of old geometry and material
            this.mesh.children.forEach(child => {
                child.geometry.dispose();
                child.material.dispose();
            });
        }

        const materials = {
            grass: new THREE.MeshLambertMaterial({ color: blockTypes.grass.color }),
            dirt: new THREE.MeshLambertMaterial({ color: blockTypes.dirt.color }),
            stone: new THREE.MeshLambertMaterial({ color: blockTypes.stone.color }),
        };

        const geometries = {
            grass: { positions: [], normals: [], indices: [] },
            dirt: { positions: [], normals: [], indices: [] },
            stone: { positions: [], normals: [], indices: [] },
        };

        const faces = [
            { dir: [ 1,  0,  0], corners: [[1, 1, 0], [1, 0, 0], [1, 1, 1], [1, 0, 1]], name: 'right'  }, // right
            { dir: [-1,  0,  0], corners: [[0, 1, 1], [0, 0, 1], [0, 1, 0], [0, 0, 0]], name: 'left'   }, // left
            { dir: [ 0,  1,  0], corners: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]], name: 'top'    }, // top
            { dir: [ 0, -1,  0], corners: [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]], name: 'bottom' }, // bottom
            { dir: [ 0,  0,  1], corners: [[1, 1, 1], [1, 0, 1], [0, 1, 1], [0, 0, 1]], name: 'front'  }, // front
            { dir: [ 0,  0, -1], corners: [[0, 1, 0], [0, 0, 0], [1, 1, 0], [1, 0, 0]], name: 'back'   }, // back
        ];

        for (let y = 0; y < this.size.y; y++) {
            for (let z = 0; z < this.size.z; z++) {
                for (let x = 0; x < this.size.x; x++) {
                    const block = this.getBlock(x, y, z);
                    if (!block.isSolid) continue;

                    const blockTypeName = Object.keys(blockTypes).find(key => blockTypes[key].id === block.id);

                    for (const { dir, corners } of faces) {
                        const neighbor = this.getBlock(x + dir[0], y + dir[1], z + dir[2]);
                        if (!neighbor.isSolid) {
                            const geo = geometries[blockTypeName];
                            const index = geo.positions.length / 3;

                            for (const pos of corners) {
                                geo.positions.push(x + pos[0], y + pos[1], z + pos[2]);
                                geo.normals.push(dir[0], dir[1], dir[2]);
                            }

                            geo.indices.push(index, index + 1, index + 2, index + 2, index + 1, index + 3);
                        }
                    }
                }
            }
        }

        const meshes = new THREE.Group();
        for (const type in geometries) {
            const geoData = geometries[type];
            if (geoData.indices.length > 0) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(geoData.positions), 3));
                geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(geoData.normals), 3));
                geometry.setIndex(geoData.indices);

                const mesh = new THREE.Mesh(geometry, materials[type]);
                meshes.add(mesh);
            }
        }

        this.mesh = meshes;
        this.mesh.userData.chunk = this; // Link mesh back to chunk object
        this.scene.add(this.mesh);
    }

    updateBlock(x, y, z, typeId) {
        this.setBlock(x, y, z, typeId);
        this.generateMesh();
    }
}

// --- WORLD ---
const world = {
    chunks: {},
    noise2D: makeNoise2D(Date.now()),
    viewDistance: 2, // in chunks

    getChunkKey(x, z) {
        return `${x},${z}`;
    },

    getBlock(x, y, z) {
        const chunkX = Math.floor(x / CHUNK_SIZE.x);
        const chunkZ = Math.floor(z / CHUNK_SIZE.z);
        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks[key];
        if (chunk) {
            const localX = x - chunk.chunkX * CHUNK_SIZE.x;
            const localZ = z - chunk.chunkZ * CHUNK_SIZE.z;
            return chunk.getBlock(localX, y, localZ);
        }
        return { id: blockTypes.air.id, isSolid: false };
    },

    update(player) {
        const playerChunkX = Math.floor(player.position.x / CHUNK_SIZE.x);
        const playerChunkZ = Math.floor(player.position.z / CHUNK_SIZE.z);

        // Load new chunks
        for (let x = playerChunkX - this.viewDistance; x <= playerChunkX + this.viewDistance; x++) {
            for (let z = playerChunkZ - this.viewDistance; z <= playerChunkZ + this.viewDistance; z++) {
                const key = this.getChunkKey(x, z);
                if (!this.chunks[key]) {
                    this.chunks[key] = new Chunk(scene, this, x, z);
                }
            }
        }

        // Unload old chunks
        for (const key in this.chunks) {
            const [x, z] = key.split(',').map(Number);
            const dx = Math.abs(x - playerChunkX);
            const dz = Math.abs(z - playerChunkZ);
            if (dx > this.viewDistance || dz > this.viewDistance) {
                this.chunks[key].dispose();
                delete this.chunks[key];
            }
        }
    }
};

// Add a dispose method to the Chunk class
Chunk.prototype.dispose = function() {
    if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.children.forEach(child => {
            child.geometry.dispose();
            child.material.dispose();
        });
    }
};

// --- PLAYER ---
class Player {
    constructor(scene, camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(8, 135, 8);
        this.velocity = new THREE.Vector3();
        this.camera.position.copy(this.position);
        this.controls = new PointerLockControls(this.camera, document.body);

        // Player constants
        this.height = 1.8;
        this.speed = 5;
        this.jumpSpeed = 8;
        this.gravity = -20;
        this.onGround = false;

        // Event listener to lock pointer
        document.body.addEventListener('click', () => {
            this.controls.lock();
        });

        scene.add(this.controls.getObject());
    }

    update(dt, world) {
        // Apply gravity
        this.velocity.y += this.gravity * dt;

        const blockBelow = world.getBlock(
            Math.floor(this.position.x),
            Math.floor(this.position.y - this.height - 0.1),
            Math.floor(this.position.z)
        );

        if (blockBelow.isSolid && this.velocity.y <= 0) {
            this.velocity.y = 0;
            this.onGround = true;
            this.position.y = Math.floor(this.position.y - this.height) + this.height + 1;
        } else {
            this.onGround = false;
        }

        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.position.y += this.velocity.y * dt;

        this.controls.getObject().position.copy(this.position);
    }
}

const player = new Player(scene, camera);

// --- BLOCK SELECTION ---
const selectionBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.01, 1.01, 1.01),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
);
scene.add(selectionBox);
const raycaster = new THREE.Raycaster();

// --- KEYBOARD INPUT ---
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    if (keys['Space'] && player.onGround) {
        player.velocity.y = player.jumpSpeed;
    }
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

document.addEventListener('mousedown', (event) => {
    if (!player.controls.isLocked) return;

    const chunkMeshes = Object.values(world.chunks).map(chunk => chunk.mesh).filter(mesh => mesh);
    const intersects = raycaster.intersectObjects(chunkMeshes.flatMap(group => group.children));

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const chunk = intersection.object.parent.userData.chunk;
        if (!chunk) return;

        if (event.button === 0) { // Left click - break block
            const position = new THREE.Vector3().copy(intersection.point).addScaledVector(intersection.face.normal, -0.5).floor();
            const localX = position.x - chunk.chunkX * CHUNK_SIZE.x;
            const localZ = position.z - chunk.chunkZ * CHUNK_SIZE.z;
            chunk.updateBlock(localX, position.y, localZ, blockTypes.air.id);
        } else if (event.button === 2) { // Right click - place block
            const position = new THREE.Vector3().copy(intersection.point).addScaledVector(intersection.face.normal, 0.5).floor();
            const localX = position.x - chunk.chunkX * CHUNK_SIZE.x;
            const localZ = position.z - chunk.chunkZ * CHUNK_SIZE.z;
            chunk.updateBlock(localX, position.y, localZ, blockTypes.stone.id);
        }
    }
});


// --- RENDER LOOP ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // Handle movement
    const forward = new THREE.Vector3();
    player.camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(player.camera.up, forward).normalize();

    let speed = player.speed;
    let moveDirection = new THREE.Vector3();

    if (keys['KeyW']) moveDirection.add(forward);
    if (keys['KeyS']) moveDirection.sub(forward);
    if (keys['KeyA']) moveDirection.add(new THREE.Vector3().crossVectors(forward, player.camera.up).normalize());
    if (keys['KeyD']) moveDirection.sub(new THREE.Vector3().crossVectors(forward, player.camera.up).normalize());

    moveDirection.normalize().multiplyScalar(speed);
    player.velocity.x = moveDirection.x;
    player.velocity.z = moveDirection.z;

    world.update(player);
    player.update(dt, world);

    // Update selection box
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const chunkMeshes = Object.values(world.chunks).map(chunk => chunk.mesh).filter(mesh => mesh);
    const intersects = raycaster.intersectObjects(chunkMeshes.flatMap(group => group.children));

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const position = new THREE.Vector3().copy(intersection.point).addScaledVector(intersection.face.normal, -0.5).floor();
        selectionBox.position.copy(position).addScalar(0.5);
        selectionBox.visible = true;
    } else {
        selectionBox.visible = false;
    }

    renderer.render(scene, camera);
}

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start rendering
animate();
