/**
 * ParticleSystem - A reusable Three.js particle system class
 * Creates an interactive particle background with mouse interaction
 */
class ParticleSystem {
    constructor(config = {}) {
        // Configuration with defaults
        this.config = {
            count: config.count || 2000,
            size: config.size || 0.5,
            color: config.color || '#4A90D9',
            speed: config.speed || 0.5,
            interaction: config.interaction !== undefined ? config.interaction : true
        };

        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.lines = null;
        this.particlePositions = null;
        this.particleVelocities = null;
        this.linePositions = null;

        // State
        this.container = null;
        this.animationId = null;
        this.mouse = { x: -9999, y: -9999, worldX: 0, worldY: 0 };
        this.isMouseIdle = true;
        this.idleTimer = null;
        this.isDestroyed = false;

        // Constants
        this.connectionDistance = 100;
        this.scatterRadius = 80;
        this.scatterStrength = 0.15;
        this.aggregationStrength = 0.002;
        this.originalPositions = [];

        // Spatial grid for performance optimization
        this.gridCellSize = this.connectionDistance;
        this.grid = new Map();
    }

    /**
     * Initialize the particle system and attach to a DOM element
     * @param {string|HTMLElement} containerIdOrElement - Container element or ID
     */
    init(containerIdOrElement) {
        if (this.isDestroyed) {
            console.error('ParticleSystem has been destroyed. Create a new instance.');
            return;
        }

        // Get container element
        if (typeof containerIdOrElement === 'string') {
            this.container = document.getElementById(containerIdOrElement);
            if (!this.container) {
                console.error(`Container element with id "${containerIdOrElement}" not found.`);
                return;
            }
        } else if (containerIdOrElement instanceof HTMLElement) {
            this.container = containerIdOrElement;
        } else {
            console.error('Invalid container. Provide an element ID or HTMLElement.');
            return;
        }

        // Create Three.js scene
        this._createScene();

        // Create particles
        this._createParticles();

        // Create connection lines
        this._createLines();

        // Setup event listeners
        this._setupEventListeners();

        // Start animation loop
        this._animate();

        console.log(`ParticleSystem initialized with ${this.config.count} particles.`);
    }

    /**
     * Create the Three.js scene, camera, and renderer
     */
    _createScene() {
        // Scene
        this.scene = new THREE.Scene();

        // Get container dimensions
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Camera - perspective camera for 3D effect
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
        this.camera.position.z = 500;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * Create particle geometry and points
     */
    _createParticles() {
        const { count, size, color } = this.config;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        this.particlePositions = new Float32Array(count * 3);
        this.particleVelocities = new Float32Array(count * 3);
        this.originalPositions = new Float32Array(count * 3);

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Initialize particle positions randomly in 3D space
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread particles across the screen area
            this.particlePositions[i3] = (Math.random() - 0.5) * width;
            this.particlePositions[i3 + 1] = (Math.random() - 0.5) * height;
            this.particlePositions[i3 + 2] = (Math.random() - 0.5) * 200;

            // Store original positions for aggregation
            this.originalPositions[i3] = this.particlePositions[i3];
            this.originalPositions[i3 + 1] = this.particlePositions[i3 + 1];
            this.originalPositions[i3 + 2] = this.particlePositions[i3 + 2];

            // Initialize velocities
            this.particleVelocities[i3] = 0;
            this.particleVelocities[i3 + 1] = 0;
            this.particleVelocities[i3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

        // Create material
        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Create points
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    /**
     * Create line segments for particle connections
     */
    _createLines() {
        const { count } = this.config;
        const maxConnections = count * 5; // Pre-allocate for performance
        this.linePositions = new Float32Array(maxConnections * 3);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));

        const material = new THREE.LineBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });

        this.lines = new THREE.LineSegments(geometry, material);
        this.lines.visible = false; // Hidden by default, shown when needed
        this.scene.add(this.lines);
    }

    /**
     * Setup mouse and resize event listeners
     */
    _setupEventListeners() {
        // Mouse move handler - store reference for removal
        this._handleMouseMove = (event) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = rect.top - event.clientY; // Flip Y for Three.js coordinates

            // Convert to world coordinates
            this.mouse.worldX = this.mouse.x - this.container.clientWidth / 2;
            this.mouse.worldY = this.mouse.y + this.container.clientHeight / 2;

            // Reset idle state
            this.isMouseIdle = false;
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                this.isMouseIdle = true;
            }, 100);
        };

        // Touch move handler - store reference for removal
        this._handleTouchMove = (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const rect = this.container.getBoundingClientRect();
                this.mouse.x = touch.clientX - rect.left;
                this.mouse.y = rect.top - touch.clientY;

                this.mouse.worldX = this.mouse.x - this.container.clientWidth / 2;
                this.mouse.worldY = this.mouse.y + this.container.clientHeight / 2;

                this.isMouseIdle = false;
                clearTimeout(this.idleTimer);
                this.idleTimer = setTimeout(() => {
                    this.isMouseIdle = true;
                }, 100);
            }
        };

        this.container.addEventListener('mousemove', this._handleMouseMove);
        this.container.addEventListener('touchmove', this._handleTouchMove, { passive: true });

        // Resize handler
        this._handleResize = () => {
            if (this.isDestroyed) return;

            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        };

        window.addEventListener('resize', this._handleResize);
    }

    /**
     * Update particle positions based on mouse interaction
     */
    _updateParticles() {
        const { count, speed, interaction } = this.config;
        const positions = this.particles.geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const px = positions[i3];
            const py = positions[i3 + 1];

            if (interaction) {
                // Calculate distance from mouse
                const dx = px - this.mouse.worldX;
                const dy = py - this.mouse.worldY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.scatterRadius && dist > 0) {
                    // Scatter particles away from mouse
                    const force = (1 - dist / this.scatterRadius) * this.scatterStrength;
                    const angle = Math.atan2(dy, dx);

                    this.particleVelocities[i3] += Math.cos(angle) * force;
                    this.particleVelocities[i3 + 1] += Math.sin(angle) * force;
                }
            }

            if (this.isMouseIdle) {
                // Slowly aggregate back to original positions
                const ox = this.originalPositions[i3];
                const oy = this.originalPositions[i3 + 1];
                const oz = this.originalPositions[i3 + 2];

                this.particleVelocities[i3] += (ox - px) * this.aggregationStrength;
                this.particleVelocities[i3 + 1] += (oy - py) * this.aggregationStrength;
                this.particleVelocities[i3 + 2] += (oz - positions[i3 + 2]) * this.aggregationStrength;
            }

            // Apply velocity with damping
            positions[i3] += this.particleVelocities[i3] * speed;
            positions[i3 + 1] += this.particleVelocities[i3 + 1] * speed;
            positions[i3 + 2] += this.particleVelocities[i3 + 2] * speed;

            // Damping to prevent infinite acceleration
            this.particleVelocities[i3] *= 0.95;
            this.particleVelocities[i3 + 1] *= 0.95;
            this.particleVelocities[i3 + 2] *= 0.95;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Build spatial grid for efficient neighbor lookup
     */
    _buildGrid() {
        this.grid.clear();
        const positions = this.particles.geometry.attributes.position.array;
        const { count } = this.config;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const x = positions[i3];
            const y = positions[i3 + 1];

            const cellX = Math.floor(x / this.gridCellSize);
            const cellY = Math.floor(y / this.gridCellSize);
            const key = `${cellX},${cellY}`;

            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(i);
        }
    }

    /**
     * Update connection lines between nearby particles using spatial grid
     */
    _updateLines() {
        if (this.isMouseIdle) {
            this.lines.visible = false;
            return;
        }

        const { count } = this.config;
        const positions = this.particles.geometry.attributes.position.array;
        const linePositions = this.lines.geometry.attributes.position.array;

        // Rebuild grid each frame for accuracy
        this._buildGrid();

        let lineIndex = 0;
        const maxLines = linePositions.length / 3;

        // Get all cell keys once
        const cellKeys = Array.from(this.grid.keys());

        // Only check connections when mouse is active for performance
        for (let i = 0; i < count && lineIndex < maxLines - 1; i++) {
            const i3 = i * 3;
            const x1 = positions[i3];
            const y1 = positions[i3 + 1];

            const cellX = Math.floor(x1 / this.gridCellSize);
            const cellY = Math.floor(y1 / this.gridCellSize);

            // Check only adjacent cells (including self)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighborKey = `${cellX + dx},${cellY + dy}`;
                    const neighborParticles = this.grid.get(neighborKey);

                    if (!neighborParticles) continue;

                    for (let n = 0; n < neighborParticles.length && lineIndex < maxLines - 1; n++) {
                        const j = neighborParticles[n];

                        // Avoid duplicate checks (only check forward)
                        if (j <= i) continue;

                        const j3 = j * 3;
                        const x2 = positions[j3];
                        const y2 = positions[j3 + 1];

                        const ddx = x2 - x1;
                        const ddy = y2 - y1;
                        const dist = Math.sqrt(ddx * ddx + ddy * ddy);

                        if (dist < this.connectionDistance) {
                            // Add line connection
                            linePositions[lineIndex * 3] = x1;
                            linePositions[lineIndex * 3 + 1] = y1;
                            linePositions[lineIndex * 3 + 2] = positions[i3 + 2];

                            lineIndex++;

                            linePositions[lineIndex * 3] = x2;
                            linePositions[lineIndex * 3 + 1] = y2;
                            linePositions[lineIndex * 3 + 2] = positions[j3 + 2];

                            lineIndex++;
                        }
                    }
                }
            }
        }

        // Update draw range
        this.lines.geometry.setDrawRange(0, lineIndex);
        this.lines.geometry.attributes.position.needsUpdate = true;
        this.lines.visible = lineIndex > 0;
    }

    /**
     * Animation loop
     */
    _animate() {
        if (this.isDestroyed) return;

        this.animationId = requestAnimationFrame(() => this._animate());

        this._updateParticles();
        this._updateLines();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Clean up and destroy the particle system
     */
    destroy() {
        this.isDestroyed = true;

        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Clear idle timer
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }

        // Remove event listeners
        if (this._handleMouseMove) {
            this.container.removeEventListener('mousemove', this._handleMouseMove);
        }
        if (this._handleTouchMove) {
            this.container.removeEventListener('touchmove', this._handleTouchMove);
        }
        window.removeEventListener('resize', this._handleResize);

        // Dispose Three.js objects
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }

        if (this.lines) {
            this.lines.geometry.dispose();
            this.lines.material.dispose();
            this.scene.remove(this.lines);
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.lines = null;
        this.particlePositions = null;
        this.particleVelocities = null;
        this.originalPositions = null;
        this.grid.clear();
        this.grid = null;

        console.log('ParticleSystem destroyed.');
    }

    /**
     * Update configuration at runtime
     * @param {Object} newConfig - New configuration values
     */
    setConfig(newConfig) {
        if (newConfig.count !== undefined) this.config.count = newConfig.count;
        if (newConfig.size !== undefined) {
            this.config.size = newConfig.size;
            if (this.particles) {
                this.particles.material.size = newConfig.size;
            }
        }
        if (newConfig.color !== undefined) {
            this.config.color = newConfig.color;
            if (this.particles) {
                this.particles.material.color.setStyle(newConfig.color);
            }
            if (this.lines) {
                this.lines.material.color.setStyle(newConfig.color);
            }
        }
        if (newConfig.speed !== undefined) this.config.speed = newConfig.speed;
        if (newConfig.interaction !== undefined) this.config.interaction = newConfig.interaction;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}
