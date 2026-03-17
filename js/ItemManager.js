import * as THREE from 'three';

export class ItemManager {
    constructor() {
        this.items = [];
        this.objectsModel = null;
        this.textureLoader = new THREE.TextureLoader();
        
        this.categories = {
            plants: [
                { type: 'corn', color: 0xFFD700, scale: 0.8 },
                { type: 'grape', color: 0x8B00FF, scale: 0.7 },
                { type: 'strawberry', color: 0xFF4444, scale: 0.6 },
                { type: 'tomato', color: 0xFF6347, scale: 0.7 }
            ],
            furniture: [
                { type: 'bench', color: 0x8B4513, scale: 1.5 },
                { type: 'fence', color: 0xA0522D, scale: 1.2 },
                { type: 'pot', color: 0xCD853F, scale: 0.8 }
            ],
            animals: [
                { type: 'cow', color: 0xFFFFFF, scale: 1.0 },
                { type: 'sheep', color: 0xFFFFFF, scale: 0.9 },
                { type: 'chicken', color: 0xFFDB58, scale: 0.7 }
            ]
        };
    }
    
    setObjectsModel(model) {
        this.objectsModel = model;
    }
    
    addItem(category, type, x, z) {
        const categoryData = this.categories[category];
        if (!categoryData) return null;
        
        const item = this.createItem(category, type);
        if (!item) return null;

        const config = categoryData.find(entry => entry.type === type);
        const baseScale = config?.scale || 1;
        
        const baseY = 0.62;

        item.position.set(x, baseY, z);
        item.scale.setScalar(0.01);
        item.userData = {
            ...item.userData,
            category,
            type,
            createdAt: Date.now(),
            scale: baseScale,
            baseY
        };
        
        item.userData.targetScale = baseScale;
        item.userData.animationTime = 0;
        item.userData.animationDuration = 0.65;
        
        this.items.push(item);
        return { mesh: item, data: item.userData };
    }
    
    createItem(category, type) {
        if (category === 'plants') {
            return this.createPlant(type);
        } else if (category === 'furniture') {
            return this.createFurniture(type);
        } else if (category === 'animals') {
            return this.createAnimal(type);
        }
        return null;
    }
    
    createPlant(type) {
        const group = new THREE.Group();
        const configData = this.categories.plants.find(p => p.type === type);
        
        // Create a simple geometry with color
        const geometry = new THREE.ConeGeometry(0.4, 0.8, 16);
        const material = new THREE.MeshStandardMaterial({
            color: configData.color,
            metalness: 0.1,
            roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        
        // Add a simple stem
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            metalness: 0,
            roughness: 0.8
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = -0.3;
        stem.castShadow = true;
        stem.receiveShadow = true;
        group.add(stem);
        
        return group;
    }
    
    createFurniture(type) {
        const group = new THREE.Group();
        const configData = this.categories.furniture.find(f => f.type === type);
        
        let geometry, mesh;
        const material = new THREE.MeshStandardMaterial({
            color: configData.color,
            metalness: 0.2,
            roughness: 0.7
        });
        
        switch(type) {
            case 'bench':
                geometry = new THREE.BoxGeometry(1.5, 0.4, 0.6);
                mesh = new THREE.Mesh(geometry, material);
                break;
            case 'fence':
                geometry = new THREE.BoxGeometry(1, 0.8, 0.1);
                mesh = new THREE.Mesh(geometry, material);
                break;
            case 'pot':
                // Create a pot using a cone
                geometry = new THREE.CylinderGeometry(0.4, 0.5, 0.6, 16);
                mesh = new THREE.Mesh(geometry, material);
                break;
        }
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        
        return group;
    }
    
    createAnimal(type) {
        const group = new THREE.Group();
        const configData = this.categories.animals.find(a => a.type === type);
        
        // Create simple animal shape
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.8);
        const material = new THREE.MeshStandardMaterial({
            color: configData.color,
            metalness: 0.1,
            roughness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Add head
        const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeometry, material);
        head.position.set(0, 0.15, -0.35);
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // Add simple animation parameters
        group.userData.moveSpeed = 0.02 * (Math.random() - 0.5);
        group.userData.moveAmplitude = 0.5;
        group.userData.startZ = 0;

        return group;
    }
    
    update() {
        const currentTime = Date.now() / 1000;
        
        this.items.forEach((item, index) => {
            // Animation on spawn
            if (item.userData.animationTime < item.userData.animationDuration) {
                item.userData.animationTime += 0.016;
                const progress = item.userData.animationTime / item.userData.animationDuration;
                const eased = 1 - Math.pow(1 - Math.min(progress, 1), 3);
                const overshoot = 1 + Math.sin(Math.min(progress, 1) * Math.PI) * 0.18;
                const scaled = item.userData.targetScale * eased * overshoot;
                
                item.scale.setScalar(scaled);
                
                const bounce = Math.max(0, Math.sin(Math.min(progress, 1) * Math.PI) * 0.45);
                item.position.y = item.userData.baseY + bounce;
            } else {
                item.scale.setScalar(item.userData.targetScale);
                item.position.y = item.userData.baseY;
            }
            
            // Animal movement
            if (item.userData.category === 'animals') {
                item.position.z = item.userData.startZ + Math.sin(currentTime * 2 + index) * item.userData.moveAmplitude * 0.1;
                item.rotation.y += 0.01;
            }
        });
    }
    
    getItemsByCategory(category) {
        return this.categories[category] || [];
    }
}
