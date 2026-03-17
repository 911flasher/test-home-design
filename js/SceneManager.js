import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        this.dayLights = [];
        this.nightLights = [];
        
        this.setupDefaultLighting();
        this.setupScene();
        this.handleResize();
    }
    
    setupDefaultLighting() {
        // Day lighting
        const dayAmbient = new THREE.AmbientLight(0xffffff, 0.8);
        this.dayLights.push(dayAmbient);
        this.scene.add(dayAmbient);
        
        const dayDirectional = new THREE.DirectionalLight(0xffffff, 1);
        dayDirectional.position.set(10, 15, 10);
        dayDirectional.castShadow = true;
        dayDirectional.shadow.mapSize.width = 2048;
        dayDirectional.shadow.mapSize.height = 2048;
        dayDirectional.shadow.camera.far = 50;
        dayDirectional.shadow.camera.left = -20;
        dayDirectional.shadow.camera.right = 20;
        dayDirectional.shadow.camera.top = 20;
        dayDirectional.shadow.camera.bottom = -20;
        this.dayLights.push(dayDirectional);
        this.scene.add(dayDirectional);
        
        // Night lighting
        const nightAmbient = new THREE.AmbientLight(0x4a5f8f, 0.3);
        nightAmbient.visible = false;
        this.nightLights.push(nightAmbient);
        this.scene.add(nightAmbient);
        
        const moonLight = new THREE.DirectionalLight(0x8899ff, 0.5);
        moonLight.position.set(-10, 12, -10);
        moonLight.visible = false;
        this.nightLights.push(moonLight);
        this.scene.add(moonLight);
        
        // Night accent lights
        const nightPointLight = new THREE.PointLight(0xffaa00, 0.4, 30);
        nightPointLight.position.set(0, 8, -3);
        nightPointLight.visible = false;
        this.nightLights.push(nightPointLight);
        this.scene.add(nightPointLight);
    }
    
    setupScene() {
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 100);
    }
    
    setDayLighting() {
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog.color.set(0x87CEEB);
        
        this.dayLights.forEach(light => light.visible = true);
        this.nightLights.forEach(light => light.visible = false);
    }
    
    setNightLighting() {
        this.scene.background = new THREE.Color(0x1a1f3a);
        this.scene.fog.color.set(0x1a1f3a);
        
        this.dayLights.forEach(light => light.visible = false);
        this.nightLights.forEach(light => light.visible = true);
    }
    
    handleResize() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
