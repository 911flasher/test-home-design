import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.rings = [];
    }
    
    createPlacementEffect(position) {
        const particleCount = 24;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 1.6 + Math.random() * 2.4;
            
            const geometry = new THREE.SphereGeometry(0.11, 10, 10);
            const hue = 0.08 + Math.random() * 0.18;
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(hue, 1, 0.6),
                emissive: new THREE.Color().setHSL(hue, 1, 0.55),
                emissiveIntensity: 1.8,
                metalness: 0.25,
                roughness: 0.2
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position).add(new THREE.Vector3(0, 0.2, 0));
            
            const particle = {
                mesh,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    3.2 + Math.random() * 1.3,
                    Math.sin(angle) * speed
                ),
                spin: (Math.random() - 0.5) * 0.2,
                life: 1,
                maxLife: 1.15
            };
            
            this.scene.add(mesh);
            this.particles.push(particle);
        }

        const ringGeometry = new THREE.RingGeometry(0.35, 0.52, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff27a,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position).add(new THREE.Vector3(0, 0.06, 0));
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        this.rings.push({ mesh: ring, life: 1, maxLife: 0.55 });
    }
    
    createSmoke(position) {
        const smokeCount = 8;
        
        for (let i = 0; i < smokeCount; i++) {
            const geometry = new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                transparent: true,
                opacity: 0.6,
                metalness: 0,
                roughness: 1
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            
            const particle = {
                mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    1 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                life: 1,
                maxLife: 2,
                type: 'smoke'
            };
            
            this.scene.add(mesh);
            this.particles.push(particle);
        }
    }
    
    update() {
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            ring.life -= 0.016 / ring.maxLife;

            if (ring.life <= 0) {
                this.scene.remove(ring.mesh);
                this.rings.splice(i, 1);
                continue;
            }

            const progress = 1 - (ring.life / ring.maxLife);
            const scale = 1 + progress * 2.2;
            ring.mesh.scale.set(scale, scale, scale);
            ring.mesh.material.opacity = 0.9 * (1 - progress);
            ring.mesh.position.y = 0.06 + progress * 0.45;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life -= 0.016 / p.maxLife;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }
            
            p.velocity.y -= 0.12;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
            p.mesh.rotation.x += p.spin;
            p.mesh.rotation.y += p.spin;
            
            const progress = 1 - (p.life / p.maxLife);
            
            if (p.type === 'smoke') {
                p.mesh.material.opacity = (1 - progress) * 0.6;
                p.mesh.scale.set(1 + progress, 1 + progress, 1 + progress);
            } else {
                p.mesh.material.emissiveIntensity = 1.8 * (1 - progress);
                const scale = 1 - progress * 0.55;
                p.mesh.scale.set(scale, scale, scale);
            }
        }
    }
}
