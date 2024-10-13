import * as THREE from '../imports/three.module.js'

export class Graphics {
    constructor(scene) {
        this.sun = null;
        this.sunOffset = new THREE.Vector3(50, 120, 80);

        this.scene = scene

        this.scene.background = new THREE.Color(0x80b1ff);
        this.setupLights();

        //this.newLamp(7, 2.5, 3)
    }

    newLamp(x, y, z) {
        const light = new THREE.PointLight(new THREE.Color(1, 1, 1), 5)
        light.position.set(x, y, z)
        light.castShadow = true
        light.shadow.mapSize.width = 1024; // Default is 512
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.1; // Shadow camera's near plane
        light.shadow.camera.far = 10; // Shadow camera's far plane
        this.scene.add(light)

        const helper = new THREE.CameraHelper(light.shadow.camera);
        this.scene.add(helper)
    }

    setupLights() {
        this.sun = new THREE.DirectionalLight();
        this.sun.intensity = 1;
        this.sun.position.copy(this.sunOffset);
        this.sun.castShadow = true;

        this.sun.shadow.camera.left = -20;
        this.sun.shadow.camera.right = 20;
        this.sun.shadow.camera.top = 20;
        this.sun.shadow.camera.bottom = -20;
        this.sun.shadow.camera.near = 0.1;
        this.sun.shadow.camera.far = 200;
        this.sun.shadow.mapSize = new THREE.Vector2(512, 512);
        this.scene.add(this.sun);
        this.scene.add(this.sun.target);

        const ambient = new THREE.AmbientLight();
        ambient.intensity = 0.2;
        this.scene.add(ambient);
    }

    update() {
        /*
        if (this.sun) {
            this.sun.position.copy(this.player.position);
            this.sun.position.add(this.sunOffset.clone());
            this.sun.target.position.copy(this.player.position);
        }
        */
    }
}