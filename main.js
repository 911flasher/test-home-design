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
        
        this.isDay = true;
        this.selectedItem = null;
        this.gardenBounds = { minX: -7.5, maxX: 7.5, minZ: -7.5, maxZ: 7.5 };
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.55);
        
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
        camera.fov = 60;
        camera.position.set(-10, 67, 25);
        camera.lookAt(0, 1.8,0);
        camera.updateProjectionMatrix();
    }
    
    loadModels() {
        const loader = new GLTFLoader();
        
        // Load ground
        loader.load('./gltf/ground.glb', (gltf) => {
            const ground = gltf.scene;
            ground.scale.set(2.15, 1, 2.15);
            this.sceneManager.scene.add(ground);
            this.audioManager.playTheme();
        });
        
        // Load objects
        loader.load('./gltf/objects.glb', (gltf) => {
            this.itemManager.setObjectsModel(gltf.scene);
        });
    }
    
    setupLighting() {
        this.sceneManager.setDayLighting();
    }
    
    setupInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const hitPoint = new THREE.Vector3();
        
        window.addEventListener('click', (event) => {
            // Check if clicking on UI
            if (event.target.closest('.ui-container')) {
                return;
            }
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.sceneManager.camera);
            
            if (raycaster.ray.intersectPlane(this.groundPlane, hitPoint)) {
                const x = THREE.MathUtils.clamp(hitPoint.x, this.gardenBounds.minX, this.gardenBounds.maxX);
                const z = THREE.MathUtils.clamp(hitPoint.z, this.gardenBounds.minZ, this.gardenBounds.maxZ);
                
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
                    z
                );
                
                if (item) {
                    item.mesh.userData.startZ = z;
                    this.sceneManager.scene.add(item.mesh);
                    this.particleSystem.createPlacementEffect(new THREE.Vector3(x, 0.62, z));
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
        
        // Update items animations
        this.itemManager.update();
        
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
