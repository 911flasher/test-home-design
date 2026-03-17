import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

export class ItemManager {
    constructor() {
        this.items = [];
        this.objectsModel = null;
        this.objectAnimations = [];
        this.animationMixers = [];
        this.modelMap = {
            grape: ['grape_1', 'grape_2', 'grape_3', 'grape'],
            corn: ['corn_1', 'corn_2', 'corn_3', 'corn'],
            strawberry: ['strawberry_1', 'strawberry_2', 'strawberry_3', 'strawberry'],
            tomato: ['tomato_1', 'tomato_2', 'tomato_3', 'tomato'],
            fence: ['fence'],
            cow: ['cow_1'],
            sheep: ['sheep_1'],
            chicken: ['chicken_1']
        };
        this.modelSizeTargets = {
            corn: 3.2,
            grape: 3.0,
            strawberry: 2.5,
            tomato: 2.7,
            fence: 5.2,
            cow: 5.0,
            sheep: 4.2,
            chicken: 2.8
        };
        
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
    
    setObjectsModel(model, animations = []) {
        this.objectsModel = model;
        this.objectAnimations = animations;
    }
    
    addItem(category, type, x, z, y = 0) {
        const categoryData = this.categories[category];
        if (!categoryData) return null;
        
        const item = this.createItem(category, type);
        if (!item) return null;

        const config = categoryData.find(entry => entry.type === type);
        const baseScale = config?.scale || 1;
        
        const baseY = y + 0.02;

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

        if (category === 'animals') {
            item.rotation.y = THREE.MathUtils.degToRad(Math.random() * 180);
        }
        
        this.items.push(item);
        return { mesh: item, data: item.userData };
    }
    
    createItem(category, type) {
        const modelItem = this.createModelItem(type);
        if (modelItem) {
            return modelItem;
        }

        if (category === 'plants') {
            return this.createPlant(type);
        } else if (category === 'furniture') {
            return this.createFurniture(type);
        } else if (category === 'animals') {
            return this.createAnimal(type);
        }
        return null;
    }

    createModelItem(type) {
        if (!this.objectsModel || !this.modelMap[type]) {
            return null;
        }

        const source = this.findModelSourceByAliases(this.modelMap[type]);
        if (!source) {
            return null;
        }

        const modelGroup = new THREE.Group();
        const clone = cloneSkinned(source);
        modelGroup.add(clone);

        const wrapper = new THREE.Group();
        wrapper.add(modelGroup);
        wrapper.scale.setScalar(0.5);
        this.normalizeModelWrapper(modelGroup);
        this.applyModelTargetSize(modelGroup, type);
        this.prepareModelShadows(wrapper);

        if (this.isAnimatedAnimal(type)) {
            this.setupAnimalAnimations(wrapper, type);
        }

        return wrapper;
    }

    findModelSourceByAliases(names) {
        for (const name of names) {
            const source = this.findModelSource(name);
            if (source) {
                return source;
            }
        }

        return null;
    }

    findModelSource(name) {
        if (!this.objectsModel) {
            return null;
        }

        const directMatch = this.objectsModel.getObjectByName(name);
        if (directMatch) {
            return directMatch;
        }

        let prefixMatch = null;
        this.objectsModel.traverse((child) => {
            if (prefixMatch || !child.name) return;
            if (child.name === name || child.name.startsWith(`${name}_`) || child.name.startsWith(`${name}.`)) {
                prefixMatch = child;
            }
        });

        return prefixMatch;
    }

    normalizeModelWrapper(group) {
        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);

        if (box.isEmpty()) {
            return;
        }

        const center = box.getCenter(new THREE.Vector3());
        group.position.x -= center.x;
        group.position.z -= center.z;
        group.position.y -= box.min.y;
    }

    applyModelTargetSize(group, type) {
        const targetSize = this.modelSizeTargets[type];
        if (!targetSize) {
            return;
        }

        group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(group);
        if (box.isEmpty()) {
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const currentMaxDimension = Math.max(size.x, size.y, size.z);
        if (currentMaxDimension <= 0) {
            return;
        }

        const scaleFactor = targetSize / currentMaxDimension;
        group.scale.multiplyScalar(scaleFactor);
        group.updateMatrixWorld(true);

        const adjustedBox = new THREE.Box3().setFromObject(group);
        group.position.y -= adjustedBox.min.y;
    }

    prepareModelShadows(group) {
        group.traverse((child) => {
            if (child.isMesh || child.isSkinnedMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;
                child.renderOrder = 1;

                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.filter(Boolean).forEach((material) => {
                    material.needsUpdate = true;
                });

                if (child.isSkinnedMesh) {
                    child.bindMode = 'attached';
                }

                if (child.geometry) {
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();
                }
            }
        });
    }

    isAnimatedAnimal(type) {
        return type === 'cow' || type === 'sheep' || type === 'chicken';
    }

    setupAnimalAnimations(group, type) {
        const mixer = new THREE.AnimationMixer(group);
        const idleClip = this.findAnimationClip(`idle_${type}`);
        const actionClip = this.findAnimationClip(`action_${type}`);
        const idleAction = idleClip ? mixer.clipAction(idleClip) : null;
        const actionAction = actionClip ? mixer.clipAction(actionClip) : null;

        if (idleAction) {
            idleAction.enabled = true;
            idleAction.reset();
            idleAction.play();
        }

        if (actionAction) {
            actionAction.loop = THREE.LoopOnce;
            actionAction.clampWhenFinished = true;
            mixer.addEventListener('finished', (event) => {
                if (event.action !== actionAction) return;

                actionAction.stop();
                if (idleAction) {
                    idleAction.reset();
                    idleAction.play();
                }

                group.userData.nextRandomActionAt = this.getNextActionDelay();
            });
        }

        group.userData.mixer = mixer;
        group.userData.idleAction = idleAction;
        group.userData.actionAction = actionAction;
        group.userData.nextRandomActionAt = this.getNextActionDelay();
        group.userData.actionTimer = 0;
        this.animationMixers.push(mixer);
    }

    findAnimationClip(name) {
        return this.objectAnimations.find((clip) => clip.name === name) || null;
    }

    getNextActionDelay() {
        return 3 + Math.random() * 3;
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
    
    update(delta = 0.016) {
        this.animationMixers.forEach((mixer) => mixer.update(delta));
        
        this.items.forEach((item) => {
            // Animation on spawn
            if (item.userData.animationTime < item.userData.animationDuration) {
                item.userData.animationTime += delta;
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
            
            if (item.userData.actionAction) {
                item.userData.actionTimer += delta;

                const actionRunning = item.userData.actionAction.isRunning();
                if (!actionRunning && item.userData.actionTimer >= item.userData.nextRandomActionAt) {
                    item.userData.actionTimer = 0;
                    if (item.userData.idleAction) {
                        item.userData.idleAction.stop();
                    }
                    item.userData.actionAction.reset();
                    item.userData.actionAction.play();
                }
            }
        });
    }
    
    getItemsByCategory(category) {
        return this.categories[category] || [];
    }
}
