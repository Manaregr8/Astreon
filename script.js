// High-Resolution Earth Visualization with Three.js
class EarthVisualization {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Earth objects
        this.earthGroup = null;
        this.earth = null;
        this.clouds = null;
        this.atmosphere = null;
        this.stars = null;
        
        // Animation properties
        this.isAnimating = true;
        this.showClouds = true;
        this.showAtmosphere = true;
        this.earthRotationSpeed = 0.5;
        this.cloudRotationSpeed = 0.3;
        this.hasStarted = false;
        this.textSpawnInterval = null;
        this.escapeHandler = null;
        this.currentDialog = null;
        this.currentAnimation = null;
        this.backgroundMusic = null;
        this.clickSound = null;
        this.distortedVoices = [];
        this.lastVoiceTime = 0;
        this.voiceInterval = null;
        
        // Loading management
        this.loadingManager = null;
        this.textureLoader = null;
        this.loadedTextures = 0;
        this.totalTextures = 5;
        
        this.init();
    }
    
    init() {
        this.setupLoadingManager();
        this.setupAudio();
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createStarfield();
        this.loadTextures();
        this.setupEventListeners();
        this.animate();
    }
    
    setupLoadingManager() {
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            const progressBar = document.querySelector('.loading-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        };
        
        this.loadingManager.onLoad = () => {
            setTimeout(() => {
                const loading = document.getElementById('loading');
                if (loading) {
                    loading.classList.add('hidden');
                }
            }, 500);
        };
    }
    
    setupAudio() {
        // Setup background music
        this.backgroundMusic = document.getElementById('backgroundMusic');
        if (this.backgroundMusic) {
            // Set volume to a comfortable level
            this.backgroundMusic.volume = 0.3;
            
            // Try to play immediately
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Background music started successfully');
                }).catch((error) => {
                    console.log('Autoplay prevented, will start on user interaction:', error);
                    // Add event listener for first user interaction
                    this.addAudioStartListener();
                });
            }
        }
        
        // Setup click sound
        this.clickSound = document.getElementById('clickSound');
        if (this.clickSound) {
            this.clickSound.volume = 0.6; // Slightly louder for clear feedback
        }
        
        // Setup distorted voices
        const voice1 = document.getElementById('distortedVoice1');
        const voice2 = document.getElementById('distortedVoice2');
        if (voice1 && voice2) {
            voice1.volume = 0.4; // Atmospheric volume
            voice2.volume = 0.4;
            this.distortedVoices = [voice1, voice2];
            this.startRandomVoiceSystem();
        }
    }
    
    addAudioStartListener() {
        const startAudio = () => {
            if (this.backgroundMusic && this.backgroundMusic.paused) {
                this.backgroundMusic.play().catch(console.error);
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
        document.addEventListener('touchstart', startAudio);
    }
    
    playClickSound() {
        if (this.clickSound) {
            // Reset the audio to beginning and play
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(console.error);
        }
    }
    
    startRandomVoiceSystem() {
        console.log('Starting random voice system...');
        
        // Normal atmospheric interval
        this.voiceInterval = setInterval(() => {
            this.maybePlayRandomVoice();
        }, 25000); // Check every 25 seconds
    }
    
    maybePlayRandomVoice() {
        const now = Date.now();
        const timeSinceLastVoice = now - this.lastVoiceTime;
        const randomChance = Math.random();
        
        // Atmospheric settings: 60 second minimum gap, 15% chance
        if (timeSinceLastVoice > 60000 && randomChance < 0.15) {
            console.log('Triggering atmospheric voice...');
            this.playRandomVoice();
        }
    }
    
    playRandomVoice() {
        console.log(`Attempting to play random voice. Available voices: ${this.distortedVoices.length}`);
        
        if (this.distortedVoices.length === 0) {
            console.log('No distorted voices available!');
            return;
        }
        
        // Pick a random voice from the array
        const randomIndex = Math.floor(Math.random() * this.distortedVoices.length);
        const selectedVoice = this.distortedVoices[randomIndex];
        
        console.log(`Selected voice ${randomIndex + 1}:`, selectedVoice);
        
        if (selectedVoice) {
            // Reset to beginning and play
            selectedVoice.currentTime = 0;
            selectedVoice.play().then(() => {
                console.log(`✓ Successfully playing distorted voice ${randomIndex + 1} for 5 seconds`);
                this.lastVoiceTime = Date.now();
                
                // Stop after 5 seconds
                setTimeout(() => {
                    selectedVoice.pause();
                    selectedVoice.currentTime = 0;
                    console.log(`✓ Stopped distorted voice ${randomIndex + 1} after 5 seconds`);
                }, 5000);
                
            }).catch((error) => {
                console.error(`✗ Error playing distorted voice ${randomIndex + 1}:`, error);
            });
        }
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 250, 1400);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 0, 1000);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.6;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    createControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 60;
        this.controls.maxDistance = 1200;
        this.controls.enablePan = false;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        
        // Disable all user interactions
        this.controls.enabled = false;
    }
    
    createLights() {
        // Main directional light (Sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(200, 0, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        // Ambient light for overall scene illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Rim light for atmosphere effect
        const rimLight = new THREE.DirectionalLight(0x4d79a3, 0.8);
        rimLight.position.set(-200, 50, -100);
        this.scene.add(rimLight);
    }
    
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            sizeAttenuation: true
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    loadTextures() {
        // Load all Earth textures
        const dayTexture = this.textureLoader.load('8k_earth_daymap.jpg');
        const nightTexture = this.textureLoader.load('8k_earth_nightmap.jpg');
        const normalTexture = this.textureLoader.load('8k_earth_normal_map.tif');
        const specularTexture = this.textureLoader.load('8k_earth_specular_map.tif');
        const cloudTexture = this.textureLoader.load('8k_earth_clouds.jpg');
        
        // Configure texture settings for better quality
        [dayTexture, nightTexture, normalTexture, specularTexture, cloudTexture].forEach(texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });
        
        this.createEarth(dayTexture, nightTexture, normalTexture, specularTexture);
        this.createClouds(cloudTexture);
        // Atmosphere removed - was causing thick green border
    }
    
    createEarth(dayTexture, nightTexture, normalTexture, specularTexture) {
        const earthGeometry = new THREE.SphereGeometry(50, 128, 64);
        
        // Custom shader material for day/night cycle
        const earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                normalMap: { value: normalTexture },
                specularMap: { value: specularTexture },
                lightDirection: { value: new THREE.Vector3(1, 0, 0.5).normalize() },
                atmosphereColor: { value: new THREE.Color(0.3, 0.8, 0.4) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vLightVector;
                
                uniform vec3 lightDirection;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    vPosition = position;
                    vLightVector = normalize(lightDirection);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform sampler2D normalMap;
                uniform sampler2D specularMap;
                uniform vec3 lightDirection;
                uniform vec3 atmosphereColor;
                
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vLightVector;
                
                void main() {
                    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
                    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
                    vec3 normal = normalize(vNormal);
                    vec3 specular = texture2D(specularMap, vUv).rgb;
                    
                    // Calculate lighting
                    float lightIntensity = dot(normal, vLightVector);
                    lightIntensity = smoothstep(-0.1, 0.1, lightIntensity);
                    
                    // Convert day areas to green and white only
                    float dayBrightness = (dayColor.r + dayColor.g + dayColor.b) / 3.0;
                    vec3 greenDayColor = vec3(
                        dayBrightness * 0.3,  // Low red for green tint
                        dayBrightness * 0.9,  // High green
                        dayBrightness * 0.5   // Medium blue for white areas
                    );
                    
                    // Convert night areas to green tones too
                    float nightBrightness = (nightColor.r + nightColor.g + nightColor.b) / 3.0;
                    vec3 greenNightColor = vec3(
                        nightBrightness * 0.2,  // Very low red for dark green
                        nightBrightness * 0.7,  // Dominant green but darker than day
                        nightBrightness * 0.3   // Low blue for slight variation
                    );
                    
                    // Mix day and night textures (both now green-tinted)
                    vec3 color = mix(greenNightColor * 0.8, greenDayColor, lightIntensity);
                    
                    // Add specular highlights on water (green tinted)
                    float specularFactor = pow(max(0.0, dot(reflect(-vLightVector, normal), normalize(vPosition))), 32.0);
                    color += specular * specularFactor * vec3(0.3, 0.8, 0.4) * 0.5;
                    
                    // Add atmospheric scattering (very subtle green)
                    float fresnel = 1.0 - dot(normal, normalize(vPosition));
                    fresnel = pow(fresnel, 5.0);
                    vec3 greenAtmosphere = vec3(0.1, 0.3, 0.15);
                    color = mix(color, greenAtmosphere, fresnel * 0.02);
                    
                    // Final color correction to eliminate any remaining blue
                    color.r = min(color.r, color.g * 0.6);  // Cap red relative to green
                    color.b = min(color.b, color.g * 0.7);  // Cap blue relative to green
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.earth.castShadow = true;
        
        // Create Earth group for easier manipulation
        this.earthGroup = new THREE.Group();
        this.earthGroup.add(this.earth);
        this.scene.add(this.earthGroup);
    }
    
    createClouds(cloudTexture) {
        const cloudGeometry = new THREE.SphereGeometry(50.5, 64, 32);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        this.earthGroup.add(this.clouds);
    }
    
    // createAtmosphere() method removed - was causing thick green border
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start experience controls
        this.setupStartExperience();
    }
    
    zoomToPlanet() {
        // Calculate how far right to look to put Earth on the left side
        const aspect = window.innerWidth / window.innerHeight;
        const fov = this.camera.fov * Math.PI / 180;
        const distance = 160;
        
        // Calculate the right offset for the camera target
        const rightLookOffset = Math.tan(fov / 2) * distance * aspect;
        
        // Animate camera position to zoom distance
        gsap.to(this.camera.position, {
            duration: 3,
            z: distance,
            x: 0,
            y: 0,
            ease: "power2.inOut"
        });
        
        // Animate the controls target to look right (Earth moves left)
        gsap.to(this.controls.target, {
            duration: 3,
            x: rightLookOffset,
            y: 0,
            z: 0,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            },
            onComplete: () => {
                // Show the game menu after zoom completes
                this.showGameMenu();
            }
        });
    }
    
    zoomOut() {
        // Animate camera position back to distant view
        gsap.to(this.camera.position, {
            duration: 3,
            z: 1000,
            x: 0,
            y: 0,
            ease: "power2.inOut"
        });
        
        // Reset the controls target back to center (Earth moves back to center)
        gsap.to(this.controls.target, {
            duration: 3,
            x: 0,
            y: 0,
            z: 0,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            }
        });
    }
    
    setupStartExperience() {
        const startText = document.getElementById('startText');
        
        // Show social media icons in initial frame
        this.showSocialMedia();
        this.setupSocialMediaInteractions();
        
        // Add temporary test key for voices (V key)
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'v') {
                console.log('Manual voice test triggered!');
                this.playRandomVoice();
            }
        });
        
        // Handle Enter key press
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' && !this.hasStarted) {
                this.startGame();
            }
        });
        
        // Handle click on start text
        if (startText) {
            startText.addEventListener('click', () => {
                if (!this.hasStarted) {
                    this.startGame();
                }
            });
        }
    }
    
    startGame() {
        this.playClickSound();
        this.hasStarted = true;
        const startText = document.getElementById('startText');
        const titleContainer = document.getElementById('titleContainer');
        
        // Hide all UI elements (title, year, start button, and social media)
        if (startText) {
            startText.classList.add('hidden');
        }
        if (titleContainer) {
            titleContainer.classList.add('hidden');
        }
        // Permanently hide social media icons after start
        const socialMedia = document.getElementById('socialMedia');
        if (socialMedia) {
            socialMedia.style.display = 'none';
        }
        
        // Trigger zoom to planet animation
        setTimeout(() => {
            this.zoomToPlanet();
        }, 300);
    }
    
    showGameMenu() {
        const gameMenu = document.getElementById('gameMenu');
        if (gameMenu) {
            // Remove hidden class and add visible class for smooth fade-in
            gameMenu.classList.remove('hidden');
            setTimeout(() => {
                gameMenu.classList.add('visible');
                // Start random text spawning
                this.startRandomTextSpawning();
                // Setup menu interactions
                this.setupMenuInteractions();
            }, 100);
        }
    }
    
    startRandomTextSpawning() {
        const container = document.getElementById('randomTextContainer');
        if (!container) return;
        
        const techWords = [
            'INITIALIZE', 'PROTOCOL', 'MATRIX', 'VECTOR', 'QUANTUM',
            'NEURAL', 'SYSTEM', 'BINARY', 'CODE', 'DATA',
            'CYBER', 'DIGITAL', 'STREAM', 'FLUX', 'NEXUS',
            'ORBIT', 'PLASMA', 'LASER', 'SIGNAL', 'CORE',
            'ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA',
            'ERROR', 'LOADING', 'PROCESS', 'EXECUTE', 'RUN'
        ];
        
        const spawnText = () => {
            if (!container) return;
            
            const textElement = document.createElement('div');
            textElement.className = 'random-text';
            if (Math.random() > 0.7) {
                textElement.classList.add('fade');
            }
            
            const randomWord = techWords[Math.floor(Math.random() * techWords.length)];
            textElement.textContent = randomWord;
            
            // Random position within container
            textElement.style.left = Math.random() * 300 + 'px';
            textElement.style.top = Math.random() * 500 + 200 + 'px';
            
            container.appendChild(textElement);
            
            // Remove element after animation
            setTimeout(() => {
                if (textElement.parentNode) {
                    textElement.parentNode.removeChild(textElement);
                }
            }, 4000);
        };
        
        // Spawn text at random intervals
        const spawnInterval = setInterval(() => {
            if (Math.random() > 0.4) {
                spawnText();
            }
        }, 800);
        
        // Store interval for potential cleanup
        this.textSpawnInterval = spawnInterval;
    }
    
    setupMenuInteractions() {
        // Menu option click handlers
        const menuOptions = {
            '2': { dialog: 'aboutDialog', animation: 'right' },           // About Us -> left to right
            '3': { dialog: 'problemDialog', animation: 'top' },           // Problem Statements -> left to top
            '4': { dialog: 'contactDialog', animation: 'bottom' },        // Contact Us -> left to bottom
            '5': { dialog: 'sponsorsDialog', animation: 'bottomRight' }   // Sponsors -> left to bottom-right
        };
        
        Object.keys(menuOptions).forEach(option => {
            const menuItem = document.querySelector(`[data-option="${option}"]`);
            if (menuItem) {
                menuItem.addEventListener('click', () => {
                    this.playClickSound();
                    this.showDialog(menuOptions[option].dialog, menuOptions[option].animation);
                });
            }
        });
        
        // Dialog close button handlers
        const closeButtons = document.querySelectorAll('.dialog-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playClickSound();
                const dialogType = btn.getAttribute('data-dialog');
                this.hideDialog(dialogType);
            });
        });
        
        // Dialog overlay click handlers
        const dialogs = ['aboutDialog', 'problemDialog', 'contactDialog', 'sponsorsDialog'];
        dialogs.forEach(dialogId => {
            const dialogOverlay = document.getElementById(dialogId);
            if (dialogOverlay) {
                dialogOverlay.addEventListener('click', (e) => {
                    if (e.target === dialogOverlay) {
                        const dialogType = dialogId.replace('Dialog', '');
                        this.hideDialog(dialogType);
                    }
                });
            }
        });
    }
    
    showSocialMedia() {
        const socialMedia = document.getElementById('socialMedia');
        if (socialMedia) {
            socialMedia.classList.remove('hidden');
            setTimeout(() => {
                socialMedia.classList.add('visible');
            }, 100);
        }
    }
    
    hideSocialMedia() {
        const socialMedia = document.getElementById('socialMedia');
        if (socialMedia) {
            socialMedia.classList.remove('visible');
            setTimeout(() => {
                socialMedia.classList.add('hidden');
            }, 300);
        }
    }
    
    setupSocialMediaInteractions() {
        const socialIcons = document.querySelectorAll('.social-icon');
        socialIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                this.playClickSound();
                
                const platform = icon.getAttribute('data-platform');
                console.log(`${platform} icon clicked`);
                
                // You can add actual social media links here
                // For now, just providing feedback
                switch(platform) {
                    case 'instagram':
                        // window.open('https://instagram.com/yourpage', '_blank');
                        break;
                    case 'linkedin':
                        // window.open('https://linkedin.com/company/yourcompany', '_blank');
                        break;
                    case 'discord':
                        // window.open('https://discord.gg/yourserver', '_blank');
                        break;
                }
            });
        });
    }
    
    showDialog(dialogId, animationType) {
        // Hide game menu
        const gameMenu = document.getElementById('gameMenu');
        if (gameMenu) {
            gameMenu.style.display = 'none';
        }
        
        // Store current dialog for cleanup
        this.currentDialog = dialogId;
        this.currentAnimation = animationType;
        
        // Move Earth based on animation type
        this.moveEarthTo(animationType);
        
        // Show dialog after a short delay
        setTimeout(() => {
            const dialog = document.getElementById(dialogId);
            if (dialog) {
                dialog.classList.remove('hidden');
                setTimeout(() => {
                    dialog.classList.add('visible');
                }, 50);
            }
        }, 500);
        
        // Add E key listener
        this.addEscapeListener();
    }
    
    hideDialog(dialogType) {
        const dialogId = dialogType + 'Dialog';
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.classList.remove('visible');
            setTimeout(() => {
                dialog.classList.add('hidden');
                // Show game menu again
                const gameMenu = document.getElementById('gameMenu');
                if (gameMenu) {
                    gameMenu.style.display = '';
                }
                // Move Earth back to left
                this.moveEarthToLeft();
            }, 500);
        }
        
        // Remove E key listener
        this.removeEscapeListener();
    }
    
    addEscapeListener() {
        this.escapeHandler = (event) => {
            if (event.key.toLowerCase() === 'e') {
                this.playClickSound();
                if (this.currentDialog) {
                    const dialogType = this.currentDialog.replace('Dialog', '');
                    this.hideDialog(dialogType);
                }
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }
    
    removeEscapeListener() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }
    
    moveEarthTo(direction) {
        const aspect = window.innerWidth / window.innerHeight;
        const fov = this.camera.fov * Math.PI / 180;
        const distance = 160;
        
        let targetX = 0, targetY = 0;
        
        switch(direction) {
            case 'right':
                // About Us: left to right
                targetX = -Math.tan(fov / 2) * distance * aspect * 0.8;
                targetY = 0;
                break;
            case 'top':
                // Problem Statements: left to top
                targetX = Math.tan(fov / 2) * distance * aspect * 0.6;
                targetY = Math.tan(fov / 2) * distance * 0.8;
                break;
            case 'bottom':
                // Contact Us: left to bottom
                targetX = Math.tan(fov / 2) * distance * aspect * 0.6;
                targetY = -Math.tan(fov / 2) * distance * 0.8;
                break;
            case 'bottomRight':
                // Sponsors: left to bottom-right
                targetX = -Math.tan(fov / 2) * distance * aspect * 0.6;
                targetY = -Math.tan(fov / 2) * distance * 0.6;
                break;
            default:
                targetX = 0;
                targetY = 0;
        }
        
        // Animate the controls target
        gsap.to(this.controls.target, {
            duration: 2.5,
            x: targetX,
            y: targetY,
            z: 0,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            }
        });
    }
    
    moveEarthToLeft() {
        const aspect = window.innerWidth / window.innerHeight;
        const fov = this.camera.fov * Math.PI / 180;
        const distance = 160;
        
        // Calculate right offset for camera target (Earth moves left)
        const rightLookOffset = Math.tan(fov / 2) * distance * aspect;
        
        // Animate the controls target back to right look (Earth moves left)
        gsap.to(this.controls.target, {
            duration: 2.5,
            x: rightLookOffset,
            y: 0,
            z: 0,
            ease: "power2.inOut",
            onUpdate: () => {
                this.controls.update();
            }
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating && this.earthGroup) {
            // Rotate Earth (increased by 40%)
            this.earth.rotation.y += 0.0028 * this.earthRotationSpeed;
            
            // Rotate clouds faster (increased by 90% total - 50% previous + 40% additional)
            if (this.clouds) {
                this.clouds.rotation.y += 0.0063 * this.cloudRotationSpeed;
            }
            
            // Atmosphere animation removed - atmosphere layer was removed
            
            // Slowly rotate stars
            if (this.stars) {
                this.stars.rotation.y += 0.0001;
            }
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize the Earth visualization when the page loads
window.addEventListener('load', () => {
    new EarthVisualization();
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
    } else {
        // Resume animations when tab becomes visible
    }
});
