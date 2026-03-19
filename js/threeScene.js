// threeScene.js - Cyberpunk 3D Engine

const ThreeEngine = {
    scene: null,
    camera: null,
    renderer: null,
    particles: null,
    gridHelper: null,
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    windowHalfX: window.innerWidth / 2,
    windowHalfY: window.innerHeight / 2,
    
    // View camera positions for depth transitions
    views: {
        landing: { z: 45, y: 5, x: 0 },
        login: { z: 35, y: -15, x: 25 },
        history: { z: 38, y: 15, x: -15 },
        role: { z: 25, y: -2, x: 10 },
        interview: { z: 12, y: -8, x: -8 },
        result: { z: 20, y: 10, x: 0 }
    },
    currentView: 'landing',

    init() {
        if (!window.THREE) {
            console.error("Three.js not loaded.");
            return;
        }

        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.scene = new THREE.Scene();
        // Add subtle fog to obscure distant grid
        this.scene.fog = new THREE.FogExp2(0x050505, 0.015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(this.views.landing.x, this.views.landing.y, this.views.landing.z);

        this.createParticles();
        this.createGrid();

        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.animate();
    },

    createParticles() {
        const particleCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color1 = new THREE.Color(0x00f0ff); // Neon Blue
        const color2 = new THREE.Color(0x8a2be2); // Electric Purple

        for (let i = 0; i < particleCount; i++) {
            // Spherical galaxy spread
            const r = 120 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const mixedColor = color1.clone().lerp(color2, Math.random());
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    },

    createGrid() {
        // Futuristic abstract terrain / neural net underlying grid
        const geometry = new THREE.PlaneGeometry(300, 300, 60, 60);
        
        // Displace Z to make terrain
        const posAttribute = geometry.getAttribute('position');
        for (let i = 0; i < posAttribute.count; i++) {
            const zOff = Math.random() * 8;
            posAttribute.setZ(i, zOff);
        }
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending
        });

        this.gridHelper = new THREE.Mesh(geometry, material);
        this.gridHelper.rotation.x = -Math.PI / 2;
        this.gridHelper.position.y = -25;
        
        this.scene.add(this.gridHelper);
    },

    onDocumentMouseMove(event) {
        if (!window.matchMedia("(pointer: coarse)").matches) {
            this.mouseX = (event.clientX - this.windowHalfX);
            this.mouseY = (event.clientY - this.windowHalfY);
        }
    },

    onWindowResize() {
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    transitionCameraForView(viewName) {
        if (!this.views[viewName] || !window.gsap) return;
        this.currentView = viewName;
        const target = this.views[viewName];
        
        // GSAP animate the base 'views' target so the parallax function gracefully interpolates
        gsap.to(this.views[this.currentView], {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: 1.5,
            ease: "power2.inOut"
        });
    },

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Ambient Rotations
        if (this.particles) {
            this.particles.rotation.y += 0.0004;
            this.particles.rotation.z += 0.0001;
        }

        if (this.gridHelper) {
            this.gridHelper.position.z += 0.06; 
            if(this.gridHelper.position.z > 5) {
                this.gridHelper.position.z = 0; // Infinite scroll illusion
            }
        }

        // Parallax Offset Calculation
        this.targetX = this.mouseX * 0.015;
        this.targetY = this.mouseY * 0.015;
        
        const viewPositions = this.views[this.currentView] || this.views.landing;

        // Smoothly interpolate current camera setup towards requested view + mouse parallax
        this.camera.position.x += ((viewPositions.x + this.targetX) - this.camera.position.x) * 0.05;
        this.camera.position.y += ((viewPositions.y - this.targetY) - this.camera.position.y) * 0.05;
        
        // Base Z has no mouse parallax
        this.camera.position.z += (viewPositions.z - this.camera.position.z) * 0.05;

        // Keep looking around scene origin
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    ThreeEngine.init();
    window.ThreeEngine = ThreeEngine;
});
