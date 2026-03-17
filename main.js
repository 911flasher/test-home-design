import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SceneManager } from './js/SceneManager.js';
import { UIController } from './js/UIController.js';
import { ItemManager } from './js/ItemManager.js';
import { AudioManager } from './js/AudioManager.js';
import { ParticleSystem } from './js/ParticleSystem.js';
import { I18n } from './js/i18n.js';

// Initialize the application
class GardenMakeover {
    constructor() {
        this.i18n = new I18n();
        this.sceneManager = new SceneManager();
        this.itemManager = new ItemManager();
        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem(this.sceneManager.scene);
        this.uiController = new UIController(this.itemManager);
        this.clock = new THREE.Clock();
        
        this.isDay = true;
        this.selectedItem = null;
        
        this.gardenBounds = { minX: -8.5, maxX: 8.5, minZ: -8.5, maxZ: 8.5 };
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.groundRoot = null;
        this.groundMeshes = [];
        this.groundHeightMeshes = [];
        this.placementSurface = null;
        this.placementY = 0.03;
        this.cameraTarget = new THREE.Vector3(0, 0.45, 0);
        
        this.init();
    }
    
    init() {
        // Setup camera
        this.setupCamera();
        
        // Load models
        this.loadModels();
        
        // Setup lighting
        this.setupLighting();
        
        // Setup interaction
        this.setupInteraction();
        
        // Setup UI
        this.setupUI();
        
        // Start animation loop
        this.animate();
        
        // Show tutorial
        setTimeout(() => {
            document.getElementById('tutorial').classList.add('show');
        }, 500);
    }
    
    setupCamera() {
        const camera = this.sceneManager.camera;
        // FOV controls how wide the scene feels: higher values show more area.
        camera.fov = 58;
        this.fitCameraToGarden();
        camera.updateProjectionMatrix();
        window.addEventListener('resize', () => this.fitCameraToGarden());
    }

    fitCameraToGarden() {
        const camera = this.sceneManager.camera;
        const width = this.gardenBounds.maxX - this.gardenBounds.minX;
        const depth = this.gardenBounds.maxZ - this.gardenBounds.minZ;
        // Lower fillRatio makes the whole location look smaller because the camera moves farther away.
        const fillRatio = 0.48;

        const verticalFov = THREE.MathUtils.degToRad(camera.fov);
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);

        const fitHeightDistance = (depth / 2) / (Math.tan(verticalFov / 2) * fillRatio);
        const fitWidthDistance = (width / 2) / (Math.tan(horizontalFov / 2) * fillRatio);
        // Extra distance multiplier pushes the camera back so the scene occupies less screen space.
        const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.95;
        // Y makes the camera more top-down, Z keeps the scene tilted instead of fully flat.
        const viewDirection = new THREE.Vector3(0, 1.85, 1.2).normalize();

        // cameraTarget is the center point the camera always looks at.
        camera.position.copy(this.cameraTarget).addScaledVector(viewDirection, distance);
        camera.lookAt(this.cameraTarget);
        camera.near = 0.1;
        camera.far = Math.max(180, distance * 4);
        camera.updateProjectionMatrix();
    }
    
    loadModels() {
        const loader = new GLTFLoader();
        
        // Load ground
        loader.load('./gltf/ground2.glb', (gltf) => {
            const ground = gltf.scene;
            ground.scale.set(1.65, 1.65, 1.65);
            this.sceneManager.scene.add(ground);
            this.groundRoot = ground;
            this.groundMeshes = [];
            this.groundHeightMeshes = [];
            ground.traverse((child) => {
                if (child.isMesh) {
                    this.groundMeshes.push(child);
                    const name = (child.name || '').toLowerCase();
                    if (name.includes('terrain') || name.includes('ground')) {
                        this.groundHeightMeshes.push(child);
                    }
                }
            });

            const terrain = ground.getObjectByName('terrain');
            if (terrain) {
                const terrainBox = new THREE.Box3().setFromObject(terrain);
                if (!terrainBox.isEmpty()) {
                    this.placementY = terrainBox.max.y + 0.02;
                    this.groundPlane.constant = -this.placementY;
                    if (this.placementSurface) {
                        this.placementSurface.position.y = this.placementY;
                    }
                }
            }

            this.audioManager.playTheme();
        });
        
        // Load objects
        loader.load('./gltf/objects2.glb', (gltf) => {
            this.itemManager.setObjectsModel(gltf.scene, gltf.animations);
        });
    }
    
    setupLighting() {
        this.sceneManager.setDayLighting();
    }
    
    setupInteraction() {
        const raycaster = new THREE.Raycaster();
        const heightRaycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const hitPoint = new THREE.Vector3();
        const placementGeometry = new THREE.PlaneGeometry(
            this.gardenBounds.maxX - this.gardenBounds.minX,
            this.gardenBounds.maxZ - this.gardenBounds.minZ
        );
        const placementMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.placementSurface = new THREE.Mesh(placementGeometry, placementMaterial);
        this.placementSurface.rotation.x = -Math.PI / 2;
        this.placementSurface.position.set(0, this.placementY, 0);
        this.placementSurface.name = 'placement-surface';
        this.sceneManager.scene.add(this.placementSurface);
        
        window.addEventListener('click', (event) => {
            // Check if clicking on UI
            if (event.target.closest('.ui-container')) {
                return;
            }
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.sceneManager.camera);

            let point = null;
            if (this.placementSurface) {
                const placementHits = raycaster.intersectObject(this.placementSurface, false);
                if (placementHits.length) {
                    point = placementHits[0].point.clone();
                }
            }

            if (!point && raycaster.ray.intersectPlane(this.groundPlane, hitPoint)) {
                point = hitPoint.clone();
            }

            if (point) {
                const x = THREE.MathUtils.clamp(point.x, this.gardenBounds.minX, this.gardenBounds.maxX);
                const z = THREE.MathUtils.clamp(point.z, this.gardenBounds.minZ, this.gardenBounds.maxZ);
                const y = this.resolvePlacementYAt(x, z, heightRaycaster);
                
                if (!this.selectedItem) {
                    this.audioManager.playClick();
                    this.uiController.showPointerNotification(
                        event.clientX,
                        event.clientY,
                        this.i18n.get('selectItemHint'),
                        'warning'
                    );
                    return;
                }

                const item = this.itemManager.addItem(
                    this.selectedItem.category,
                    this.selectedItem.type,
                    x,
                    z,
                    y
                );
                
                if (item) {
                    item.mesh.userData.startZ = z;
                    this.sceneManager.scene.add(item.mesh);
                    this.particleSystem.createPlacementEffect(new THREE.Vector3(x, y + 0.08, z));
                    this.audioManager.playPlacement(this.selectedItem.type);
                    this.uiController.updateItemCount();
                    this.updateStats();
                    this.uiController.showPointerNotification(
                        event.clientX,
                        event.clientY,
                        this.i18n.get('placed', { type: this.i18n.get(this.selectedItem.type) }),
                        'success'
                    );
                }
            }
        });
    }

    resolvePlacementYAt(x, z, raycaster) {
        if (this.groundHeightMeshes.length) {
            raycaster.set(
                new THREE.Vector3(x, this.placementY + 30, z),
                new THREE.Vector3(0, -1, 0)
            );

            const hits = raycaster.intersectObjects(this.groundHeightMeshes, true);
            if (hits.length) {
                return hits[0].point.y;
            }
        }

        return this.placementY;
    }
    
    setupUI() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.uiController.showCategory(category, this.i18n);
                
                // Update active state
                document.querySelectorAll('.category-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                this.audioManager.playClick();
                this.uiController.showPointerNotification(
                    e.clientX,
                    e.clientY,
                    this.i18n.get('categorySelected', { category: this.i18n.get(category) }),
                    'info'
                );
            });
        });
        
        // Day/Night toggle
        document.getElementById('dayBtn').addEventListener('click', (event) => {
            this.isDay = true;
            this.sceneManager.setDayLighting();
            document.getElementById('dayBtn').classList.add('active');
            document.getElementById('nightBtn').classList.remove('active');
            this.audioManager.playClick();
            this.uiController.showPointerNotification(event.clientX, event.clientY, this.i18n.get('modeDay'), 'info');
        });
        
        document.getElementById('nightBtn').addEventListener('click', (event) => {
            this.isDay = false;
            this.sceneManager.setNightLighting();
            document.getElementById('dayBtn').classList.remove('active');
            document.getElementById('nightBtn').classList.add('active');
            this.audioManager.playClick();
            this.uiController.showPointerNotification(event.clientX, event.clientY, this.i18n.get('modeNight'), 'info');
        });
        
        // Language toggle
        document.getElementById('langEnBtn').addEventListener('click', (event) => {
            this.i18n.setLanguage('en');
            this.updateAllText();
            document.getElementById('langEnBtn').classList.add('active');
            document.getElementById('langRuBtn').classList.remove('active');
            this.audioManager.playClick();
            this.uiController.showPointerNotification(event.clientX, event.clientY, this.i18n.get('langChangedEn'), 'info');
        });
        
        document.getElementById('langRuBtn').addEventListener('click', (event) => {
            this.i18n.setLanguage('ru');
            this.updateAllText();
            document.getElementById('langRuBtn').classList.add('active');
            document.getElementById('langEnBtn').classList.remove('active');
            this.audioManager.playClick();
            this.uiController.showPointerNotification(event.clientX, event.clientY, this.i18n.get('langChangedRu'), 'info');
        });
        
        // Initialize language button states
        if (this.i18n.getLanguage() === 'ru') {
            document.getElementById('langRuBtn').classList.add('active');
            document.getElementById('langEnBtn').classList.remove('active');
        }
        
        // Download button
        document.querySelector('.download-btn').addEventListener('click', (event) => {
            this.audioManager.playClick();
            this.uiController.showPointerNotification(event.clientX, event.clientY, 'App Store / Google Play', 'info');
            alert(this.i18n.get('downloadMessage'));
        });

        document.getElementById('muteBtn').addEventListener('click', (event) => {
            const isMuted = this.audioManager.toggleMute();
            this.uiController.setMuteButtonState(isMuted, this.i18n);
            this.uiController.showPointerNotification(
                event.clientX,
                event.clientY,
                this.i18n.get(isMuted ? 'soundMuted' : 'soundUnmuted'),
                isMuted ? 'warning' : 'success'
            );
        });
        
        this.uiController.onItemSelect = (category, type) => {
            this.selectedItem = { category, type };
            document.getElementById('infoLabel').textContent = this.i18n.get('selected', { type: this.i18n.get(type) });
        };
        
        this.updateAllText();
        this.uiController.setMuteButtonState(this.audioManager.isMuted(), this.i18n);
    }
    
    updateAllText() {
        // Update UI text
        document.getElementById('titleText').textContent = `🌳 ${this.i18n.get('title')}`;
        document.getElementById('dayBtn').textContent = this.i18n.get('day');
        document.getElementById('nightBtn').textContent = this.i18n.get('night');
        document.getElementById('infoLabel').textContent = this.i18n.get('clickToPlace');
        document.getElementById('downloadBtn').textContent = this.i18n.get('download');
        
        // Tutorial text
        document.getElementById('tutorialTitle').textContent = this.i18n.get('tutorial_title');
        document.getElementById('tutorialLine1').textContent = this.i18n.get('tutorial_line1');
        document.getElementById('tutorialLine2').textContent = this.i18n.get('tutorial_line2');
        document.getElementById('tutorialLine3').textContent = this.i18n.get('tutorial_line3');
        document.getElementById('tutorialLine4').textContent = this.i18n.get('tutorial_line4');
        document.getElementById('tutorialBtn').textContent = this.i18n.get('tutorial_button');
        
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            const category = btn.dataset.category;
            btn.textContent = this.i18n.get(category);
        });
        
        // Stats labels
        const itemCount = document.getElementById('itemCount');
        if (itemCount.parentElement.parentElement) {
            itemCount.parentElement.parentElement.innerHTML = `
                <div class="stats-item">${this.i18n.get('items')}: <span id="itemCount">${itemCount.textContent}</span></div>
                <div class="stats-item">${this.i18n.get('plantsCount')}: <span id="plantCount">${document.getElementById('plantCount').textContent}</span></div>
                <div class="stats-item">${this.i18n.get('furnitureCount')}: <span id="furnitureCount">${document.getElementById('furnitureCount').textContent}</span></div>
                <div class="stats-item">${this.i18n.get('animalsCount')}: <span id="animalCount">${document.getElementById('animalCount').textContent}</span></div>
            `;
        }
    }
    
    updateStats() {
        const stats = {
            plants: 0,
            furniture: 0,
            animals: 0
        };
        
        this.itemManager.items.forEach(item => {
            stats[item.userData.category]++;
        });
        
        document.getElementById('itemCount').textContent = this.itemManager.items.length;
        document.getElementById('plantCount').textContent = stats.plants;
        document.getElementById('furnitureCount').textContent = stats.furniture;
        document.getElementById('animalCount').textContent = stats.animals;
    }
    
    animate = () => {
        requestAnimationFrame(this.animate);
        const delta = this.clock.getDelta();
        
        // Update items animations
        this.itemManager.update(delta);
        
        // Update particles
        this.particleSystem.update();
        
        // Render scene
        this.sceneManager.render();
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    const app = new GardenMakeover();
});
