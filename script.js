// Game State
let gameState = {
    canvas: null,
    ctx: null,
    keys: {},
    mouse: { x: 0, y: 0, down: false },
    player: null,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    meteorites: [],
    comets: [],
    particles: [],
    boss: null,
    currentPlanet: null,
    gameTime: 0,
    lastSpawnTime: 0,
    spawnInterval: 2000, // 2 seconds
    spawnWave: 0,
    isPaused: false,
    isGameOver: false,
    meteoritePieces: 0,
    unlockedPlanets: ['mercury'],
    upgrades: {
        damage: 1,
        speed: 1,
        rocketSpeed: 1,
        health: 1
    },
    activeBuffs: [],
    collectedFacts: [],
    achievements: {
        orbitBreaker: false,
        solarScholar: false,
        cometRider: 0,
        planetScholar: 0,
        ironRocket: false
    },
    images: {
        player: null,
        enemy: null,
        meteorite: null
    }
};

// Planet Data
const planetData = {
    mercury: {
        name: 'Mercury',
        color: '#8C7853',
        fact: "Mercury orbits the Sun in just 88 days and has extreme temperature variations from 427°C to -173°C!",
        bossName: "Solar Flare Guardian",
        difficulty: 1,
        unlockCost: 0 // Free - starting planet
    },
    venus: {
        name: 'Venus',
        color: '#FFC649',
        fact: "Venus has a toxic atmosphere with a runaway greenhouse effect, making it the hottest planet at 462°C!",
        bossName: "Toxic Atmosphere Guardian",
        difficulty: 1.2,
        unlockCost: 50
    },
    earth: {
        name: 'Earth',
        color: '#6B93D6',
        fact: "Earth is the only known planet with life, protected by its atmosphere and magnetic field!",
        bossName: "Planet Defender",
        difficulty: 1.4,
        unlockCost: 100
    },
    mars: {
        name: 'Mars',
        color: '#C1440E',
        fact: "Mars is called the Red Planet due to iron oxide on its surface. A day on Mars is 24.6 hours!",
        bossName: "Red Planet Guardian",
        difficulty: 1.6,
        unlockCost: 200
    },
    jupiter: {
        name: 'Jupiter',
        color: '#D8CA9D',
        fact: "Jupiter is the largest planet with a Great Red Spot storm larger than Earth that's been raging for 400 years!",
        bossName: "Storm Giant",
        difficulty: 1.8,
        unlockCost: 400
    },
    saturn: {
        name: 'Saturn',
        color: '#FAD5A5',
        fact: "Saturn's rings are made of ice particles and rock, held together by gravity!",
        bossName: "Ring Keeper",
        difficulty: 2.0,
        unlockCost: 600
    },
    uranus: {
        name: 'Uranus',
        color: '#4FD0E7',
        fact: "Uranus rotates on its side at 98° tilt, causing extreme seasons lasting 21 years each!",
        bossName: "Tilted Guardian",
        difficulty: 2.2,
        unlockCost: 800
    },
    neptune: {
        name: 'Neptune',
        color: '#4B70DD',
        fact: "Neptune has the fastest winds in the solar system, reaching speeds of 2,100 km/h!",
        bossName: "Wind Master",
        difficulty: 2.4,
        unlockCost: 1000
    },
    sun: {
        name: 'Sun',
        color: '#FFD700',
        fact: "The Sun is a star that generates energy through nuclear fusion, converting hydrogen to helium!",
        bossName: "Solar Core Guardian",
        difficulty: 3.0,
        unlockCost: 1500
    }
};

// Comet Buff Types
const cometBuffs = [
    { name: 'Blazing Core', color: '#FF4444', duration: 10000, effect: 'attackSpeed', value: 1.3 },
    { name: 'Cosmic Pull', color: '#44FF44', duration: 5000, effect: 'magnet', value: 1 },
    { name: 'Solar Shield', color: '#4444FF', duration: 5000, effect: 'invincible', value: 1 },
    { name: 'Warp Boost', color: '#FF44FF', duration: 3000, effect: 'speed', value: 2 },
    { name: 'Ion Burst', color: '#FFFF44', duration: 0, effect: 'nextShot', value: 3 }
];

// Load Images
function loadImages() {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = 3;
        
        const checkLoaded = () => {
            loaded++;
            if (loaded === total) {
                resolve();
            }
        };
        
        // Load player spaceship
        gameState.images.player = new Image();
        gameState.images.player.onload = checkLoaded;
        gameState.images.player.onerror = checkLoaded;
        gameState.images.player.src = 'Assets/AllySpaceship.png';
        
        // Load enemy spaceship
        gameState.images.enemy = new Image();
        gameState.images.enemy.onload = checkLoaded;
        gameState.images.enemy.onerror = checkLoaded;
        gameState.images.enemy.src = 'Assets/EnemySpaceship.png';
        
        // Load meteorite
        gameState.images.meteorite = new Image();
        gameState.images.meteorite.onload = checkLoaded;
        gameState.images.meteorite.onerror = checkLoaded;
        gameState.images.meteorite.src = 'Assets/Meteorite.png';
    });
}

// Initialize Game
function initGame() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set canvas size
    gameState.canvas.width = window.innerWidth;
    gameState.canvas.height = window.innerHeight;
    
    // Load images first, then initialize
    loadImages().then(() => {
        // Load saved data
        loadGameData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize UI
        updatePlanetSelect();
        updateUpgradeShop();
        updateFactCollection();
        updateAchievements();
        
        // Start game loop
        gameLoop();
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
        if (e.key === 'Escape' && gameState.currentPlanet) {
            togglePause();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse
    gameState.canvas.addEventListener('mousemove', (e) => {
        const rect = gameState.canvas.getBoundingClientRect();
        gameState.mouse.x = e.clientX - rect.left;
        gameState.mouse.y = e.clientY - rect.top;
    });
    
    gameState.canvas.addEventListener('mousedown', () => {
        gameState.mouse.down = true;
    });
    
    gameState.canvas.addEventListener('mouseup', () => {
        gameState.mouse.down = false;
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        if (gameState.canvas) {
            gameState.canvas.width = window.innerWidth;
            gameState.canvas.height = window.innerHeight;
        }
    });
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Hide menu options when navigating away from main menu, or show starting screen when returning
    if (screenId === 'mainMenu') {
        hideMenuOptions(); // Reset to starting screen
    }
    
    if (screenId === 'gameScreen') {
        startGame();
    } else if (screenId === 'planetSelect') {
        updatePlanetSelect();
    } else if (screenId === 'upgradeShop') {
        updateUpgradeShop();
    }
}

function selectPlanet(planetName) {
    const planet = planetData[planetName];
    
    // Check if already unlocked
    if (gameState.unlockedPlanets.includes(planetName)) {
        gameState.currentPlanet = planetName;
        showScreen('gameScreen');
        return;
    }
    
    // Check if player has enough meteorite pieces to unlock
    if (gameState.meteoritePieces >= planet.unlockCost) {
        if (confirm(`Unlock ${planet.name} for ${planet.unlockCost} meteorite pieces?`)) {
            gameState.meteoritePieces -= planet.unlockCost;
            gameState.unlockedPlanets.push(planetName);
            updatePlanetSelect();
            updateUpgradeShop();
            saveGameData();
            
            // Auto-select the planet after unlocking
            gameState.currentPlanet = planetName;
            showScreen('gameScreen');
        }
    } else {
        alert(`This planet is locked! You need ${planet.unlockCost} meteorite pieces to unlock ${planet.name}. You have ${gameState.meteoritePieces}.`);
    }
}

function startGame() {
    if (!gameState.currentPlanet) return;
    
    // Reset game state
    gameState.gameTime = 0;
    gameState.lastSpawnTime = 0;
    gameState.spawnWave = 0;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.bullets = [];
    gameState.enemyBullets = [];
    gameState.enemies = [];
    gameState.meteorites = [];
    gameState.comets = [];
    gameState.particles = [];
    gameState.boss = null;
    gameState.activeBuffs = [];
    
    // Create player
    const planet = planetData[gameState.currentPlanet];
    gameState.player = {
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
        width: 80,
        height: 80,
        speed: 5 + (gameState.upgrades.rocketSpeed - 1) * 0.5,
        health: 100 + (gameState.upgrades.health - 1) * 20,
        maxHealth: 100 + (gameState.upgrades.health - 1) * 20,
        lastShot: 0,
        shootCooldown: 200 - (gameState.upgrades.speed - 1) * 10,
        invincible: false,
        invincibleTime: 0
    };
    
    // Show planet intro dialogue
    showDialogue(planet.name, planet.fact);
    
    // Update UI
    updateHUD();
    document.getElementById('planetDisplay').textContent = planet.name;
}

// Game Loop
function gameLoop() {
    if (!gameState.isPaused && !gameState.isGameOver && gameState.currentPlanet) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Update Game
function update() {
    if (!gameState.player) return;
    
    const dt = 16; // ~60fps
    gameState.gameTime += dt;
    
    // Update player
    updatePlayer();
    
    // Update bullets
    updateBullets();
    updateEnemyBullets();
    
    // Spawn enemies and meteorites (timer-based)
    handleSpawnTimer();
    spawnComets();
    
    // Update entities
    updateEnemies();
    updateMeteorites();
    updateComets();
    updateParticles();
    
    // Update boss
    if (gameState.boss) {
        updateBoss();
    } else if (gameState.gameTime >= 600000) { // 10 minutes
        spawnBoss();
    }
    
    // Update buffs
    updateBuffs();
    
    // Collision detection
    checkCollisions();
    
    // Update UI
    updateHUD();
    
    // Check game over
    if (gameState.player.health <= 0) {
        gameOver(false);
    }
    
    if (gameState.boss && gameState.boss.health <= 0) {
        gameOver(true);
    }
}

// Update Player
function updatePlayer() {
    const player = gameState.player;
    const speed = player.speed * (gameState.activeBuffs.find(b => b.effect === 'speed') ? gameState.activeBuffs.find(b => b.effect === 'speed').value : 1);
    
    // Movement
    if (gameState.keys['w'] || gameState.keys['W']) player.y -= speed;
    if (gameState.keys['s'] || gameState.keys['S']) player.y += speed;
    if (gameState.keys['a'] || gameState.keys['A']) player.x -= speed;
    if (gameState.keys['d'] || gameState.keys['D']) player.x += speed;
    
    // Keep player in bounds
    player.x = Math.max(player.width/2, Math.min(gameState.canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(gameState.canvas.height - player.height/2, player.y));
    
    // Shooting
    const now = Date.now();
    const attackSpeed = gameState.activeBuffs.find(b => b.effect === 'attackSpeed') ? gameState.activeBuffs.find(b => b.effect === 'attackSpeed').value : 1;
    const cooldown = player.shootCooldown / attackSpeed;
    
    if (gameState.mouse.down && now - player.lastShot > cooldown) {
        shoot();
        player.lastShot = now;
    }
    
    // Invincibility
    if (player.invincible) {
        player.invincibleTime -= 16;
        if (player.invincibleTime <= 0) {
            player.invincible = false;
        }
    }
}

// Shoot
function shoot() {
    const player = gameState.player;
    
    const damage = 10 + (gameState.upgrades.damage - 1) * 5;
    const multiplier = gameState.activeBuffs.find(b => b.effect === 'nextShot') ? gameState.activeBuffs.find(b => b.effect === 'nextShot').value : 1;
    
    // Remove nextShot buff after use
    const nextShotIndex = gameState.activeBuffs.findIndex(b => b.effect === 'nextShot');
    if (nextShotIndex !== -1) {
        gameState.activeBuffs.splice(nextShotIndex, 1);
    }
    
    // Shoot straight up
    const speed = 8 + (gameState.upgrades.rocketSpeed - 1) * 1;
    gameState.bullets.push({
        x: player.x,
        y: player.y,
        vx: 0, // No horizontal movement
        vy: -speed, // Move straight up (negative Y)
        damage: damage * multiplier,
        radius: 5
    });
}

// Update Bullets
function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove if out of bounds
        return bullet.x > 0 && bullet.x < gameState.canvas.width &&
               bullet.y > 0 && bullet.y < gameState.canvas.height;
    });
}

// Update Enemy Bullets
function updateEnemyBullets() {
    gameState.enemyBullets = gameState.enemyBullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove if out of bounds
        return bullet.x > -50 && bullet.x < gameState.canvas.width + 50 &&
               bullet.y > -50 && bullet.y < gameState.canvas.height + 50;
    });
}

// Check if there are active enemy formations
function hasActiveFormation() {
    return gameState.enemies.some(enemy => enemy.inFormation && enemy.y < gameState.canvas.height + 50);
}

// Handle Spawn Timer (spawns every 2 seconds with progressive difficulty)
function handleSpawnTimer() {
    const timeSinceLastSpawn = gameState.gameTime - gameState.lastSpawnTime;
    
    // Spawn every 2 seconds (2000ms)
    if (timeSinceLastSpawn >= gameState.spawnInterval) {
        gameState.lastSpawnTime = gameState.gameTime;
        gameState.spawnWave++;
        
        // Calculate progressive difficulty
        const planet = planetData[gameState.currentPlanet];
        const baseDifficulty = planet.difficulty;
        const timeMultiplier = 1 + (gameState.gameTime / 600000); // Gets harder over 10 minutes
        const waveMultiplier = 1 + (gameState.spawnWave * 0.05); // Gets harder each wave
        const difficulty = baseDifficulty * timeMultiplier * waveMultiplier;
        
        // Check if there's an active formation
        const hasFormation = hasActiveFormation();
        
        // Calculate how many obstacles to spawn (increases over time)
        const minutesElapsed = gameState.gameTime / 60000;
        let spawnCount = 1;
        
        if (minutesElapsed >= 1) spawnCount = 2; // After 1 minute, spawn 2
        if (minutesElapsed >= 3) spawnCount = 3; // After 3 minutes, spawn 3
        if (minutesElapsed >= 5) spawnCount = 4; // After 5 minutes, spawn 4
        if (minutesElapsed >= 7) spawnCount = 5; // After 7 minutes, spawn 5
        
        // Spawn mix of enemies and meteorites
        for (let i = 0; i < spawnCount; i++) {
            // If spawning multiple obstacles, alternate between types
            // If spawning single obstacle, alternate by wave number
            if (spawnCount > 1) {
                // Multiple obstacles: alternate within the wave
                if (i % 2 === 0) {
                    // Only spawn formation if there's no active formation
                    if (!hasFormation && Math.random() < 0.3) {
                        spawnEnemyFormation(difficulty);
                    } else {
                        spawnEnemy(difficulty);
                    }
                } else {
                    spawnMeteorite(difficulty);
                }
            } else {
                // Single obstacle: alternate by wave
                if (gameState.spawnWave % 2 === 0) {
                    // Only spawn formation if there's no active formation
                    if (!hasFormation && Math.random() < 0.3) {
                        spawnEnemyFormation(difficulty);
                    } else {
                        spawnEnemy(difficulty);
                    }
                } else {
                    spawnMeteorite(difficulty);
                }
            }
        }
    }
}

// Spawn Single Enemy
function spawnEnemy(difficulty) {
    // Spawn from top of screen
    const x = Math.random() * gameState.canvas.width;
    const y = -30;
    
    gameState.enemies.push({
        x: x,
        y: y,
        width: 60,
        height: 60,
        speed: 1 + difficulty * 0.3, // Horizontal speed for hovering
        fallSpeed: 1 + difficulty * 0.2, // Vertical fall speed
        health: 20 + difficulty * 10,
        maxHealth: 20 + difficulty * 10,
        color: '#FF0000',
        lastShot: 0,
        shootCooldown: 2000 - (difficulty * 100), // Shoot every 2 seconds (faster with difficulty)
        targetX: x, // Target X position to hover over player
        inFormation: false,
        formationType: null,
        formationIndex: 0,
        formationCenterX: 0,
        formationCenterY: 0,
        stopY: 0 // Y position where formation stops
    });
}

// Spawn Enemy Formation
function spawnEnemyFormation(difficulty) {
    const formationTypes = ['horizontal', 'circle', 'diagonal', 'v-shape'];
    const formationType = formationTypes[Math.floor(Math.random() * formationTypes.length)];
    const formationSize = 3 + Math.floor(Math.random() * 3); // 3-5 enemies
    
    const centerX = Math.random() * (gameState.canvas.width - 200) + 100; // Keep formation on screen
    const stopY = 100 + Math.random() * 50; // Stop at top of screen (100-150px from top)
    
    for (let i = 0; i < formationSize; i++) {
        let x, y;
        
        switch(formationType) {
            case 'horizontal':
                // Horizontal line formation
                const spacing = 80;
                const startX = centerX - ((formationSize - 1) * spacing) / 2;
                x = startX + i * spacing;
                y = -30;
                break;
                
            case 'circle':
                // Circle formation
                const radius = 60 + formationSize * 8;
                const angle = (i / formationSize) * Math.PI * 2;
                x = centerX + Math.cos(angle) * radius;
                y = -30;
                break;
                
            case 'diagonal':
                // Diagonal line formation
                const diagonalSpacing = 70;
                x = centerX + (i - (formationSize - 1) / 2) * diagonalSpacing;
                y = -30 - (i * 20); // Stagger vertically
                break;
                
            case 'v-shape':
                // V-shape formation
                const vSpacing = 70;
                const vOffset = Math.abs(i - (formationSize - 1) / 2) * vSpacing;
                x = centerX + (i < formationSize / 2 ? -vOffset : vOffset);
                y = -30 - (Math.abs(i - (formationSize - 1) / 2) * 15);
                break;
        }
        
        gameState.enemies.push({
            x: x,
            y: y,
            width: 60,
            height: 60,
            speed: 1 + difficulty * 0.3,
            fallSpeed: 1 + difficulty * 0.2,
            health: 20 + difficulty * 10,
            maxHealth: 20 + difficulty * 10,
            color: '#FF0000',
            lastShot: 0,
            shootCooldown: 2000 - (difficulty * 100),
            targetX: x,
            inFormation: true,
            formationType: formationType,
            formationIndex: i,
            formationSize: formationSize,
            formationCenterX: centerX,
            formationCenterY: stopY,
            stopY: stopY,
            originalX: x // Store original position in formation
        });
    }
}

// Update Enemies
function updateEnemies() {
    const player = gameState.player;
    const now = Date.now();
    
    gameState.enemies.forEach(enemy => {
        if (enemy.inFormation) {
            // Formation behavior: stop at top and maintain formation
            const targetY = enemy.stopY + (enemy.formationType === 'diagonal' ? enemy.formationIndex * 20 : 0) + 
                           (enemy.formationType === 'v-shape' ? Math.abs(enemy.formationIndex - (enemy.formationSize - 1) / 2) * 15 : 0);
            
            if (enemy.y < targetY) {
                // Still falling to formation position
                enemy.y += enemy.fallSpeed;
                if (enemy.y > targetY) enemy.y = targetY; // Don't overshoot
                
                // Update formation position based on type
                updateFormationPosition(enemy);
            } else {
                // Reached formation position - stop and maintain formation
                enemy.y = targetY;
                updateFormationPosition(enemy);
                
                // Shoot downward at player (only shoot downward, not upward)
                if (now - enemy.lastShot > enemy.shootCooldown && enemy.y < player.y) {
                    // Only shoot if enemy is above player
                    const bulletDx = player.x - enemy.x;
                    const bulletDy = player.y - enemy.y;
                    const bulletDist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
                    
                    if (bulletDist > 0 && bulletDy > 0) { // Only shoot downward
                        gameState.enemyBullets.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (bulletDx / bulletDist) * 3,
                            vy: Math.abs((bulletDy / bulletDist) * 3), // Always positive (downward)
                            radius: 5,
                            damage: 10
                        });
                        enemy.lastShot = now;
                    }
                }
            }
        } else {
            // Single enemy behavior: hover and fall
            // Update target X position to hover over player
            enemy.targetX = player.x;
            
            // Move horizontally towards player's X position (hover)
            const dx = enemy.targetX - enemy.x;
            if (Math.abs(dx) > 5) {
                enemy.x += Math.sign(dx) * enemy.speed;
            } else {
                enemy.x = enemy.targetX; // Snap to position when close
            }
            
            // Fall down
            enemy.y += enemy.fallSpeed;
            
            // Shoot downward at player (only shoot downward, not upward)
            if (now - enemy.lastShot > enemy.shootCooldown && enemy.y < player.y && enemy.y > 50) {
                // Only shoot if enemy is above player
                const bulletDx = player.x - enemy.x;
                const bulletDy = player.y - enemy.y;
                const bulletDist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
                
                if (bulletDist > 0 && bulletDy > 0) { // Only shoot downward
                    gameState.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (bulletDx / bulletDist) * 3,
                        vy: Math.abs((bulletDy / bulletDist) * 3), // Always positive (downward)
                        radius: 5,
                        damage: 10
                    });
                    enemy.lastShot = now;
                }
            }
        }
    });
    
    // Remove enemies that are off screen
    gameState.enemies = gameState.enemies.filter(enemy => 
        enemy.y < gameState.canvas.height + 50
    );
}

// Update Formation Position
function updateFormationPosition(enemy) {
    if (!enemy.inFormation) return;
    
    const player = gameState.player;
    
    // Update formation center to follow player horizontally
    enemy.formationCenterX = player.x;
    
    // Calculate position in formation
    switch(enemy.formationType) {
        case 'horizontal':
            const spacing = 80;
            const startX = enemy.formationCenterX - ((enemy.formationSize - 1) * spacing) / 2;
            enemy.x = startX + enemy.formationIndex * spacing;
            break;
            
        case 'circle':
            const radius = 60;
            const angle = (enemy.formationIndex / enemy.formationSize) * Math.PI * 2;
            enemy.x = enemy.formationCenterX + Math.cos(angle) * radius;
            // Circle formation maintains same Y (all at stopY)
            break;
            
        case 'diagonal':
            const diagonalSpacing = 70;
            enemy.x = enemy.formationCenterX + (enemy.formationIndex - (enemy.formationSize - 1) / 2) * diagonalSpacing;
            break;
            
        case 'v-shape':
            const vSpacing = 70;
            const vOffset = Math.abs(enemy.formationIndex - (enemy.formationSize - 1) / 2) * vSpacing;
            enemy.x = enemy.formationCenterX + (enemy.formationIndex < enemy.formationSize / 2 ? -vOffset : vOffset);
            break;
    }
    
    // Keep formation on screen
    enemy.x = Math.max(15, Math.min(gameState.canvas.width - 15, enemy.x));
}

// Spawn Single Meteorite
function spawnMeteorite(difficulty) {
    // Spawn from top of screen
    const x = Math.random() * gameState.canvas.width;
    const y = -30;
    
    // Small horizontal drift, but mostly falls straight down
    const vx = (Math.random() - 0.5) * 1; // Minimal horizontal movement
    const vy = 3 + difficulty * 0.5; // Falls down
    
    // Size increases slightly with difficulty
    const baseSize = 40;
    const sizeVariation = 60;
    const difficultySize = difficulty * 10;
    const size = baseSize + Math.random() * sizeVariation + difficultySize;
    
    gameState.meteorites.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: size,
        health: size,
        maxHealth: size
    });
}

// Update Meteorites
function updateMeteorites() {
    gameState.meteorites.forEach(meteorite => {
        meteorite.x += meteorite.vx;
        meteorite.y += meteorite.vy;
    });
    
    // Remove out of bounds
    gameState.meteorites = gameState.meteorites.filter(m => 
        m.x > -50 && m.x < gameState.canvas.width + 50 &&
        m.y > -50 && m.y < gameState.canvas.height + 50
    );
}

// Spawn Comets
function spawnComets() {
    if (Math.random() < 0.001) { // Rare spawn
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: x = Math.random() * gameState.canvas.width; y = -20; break;
            case 1: x = gameState.canvas.width + 20; y = Math.random() * gameState.canvas.height; break;
            case 2: x = Math.random() * gameState.canvas.width; y = gameState.canvas.height + 20; break;
            case 3: x = -20; y = Math.random() * gameState.canvas.height; break;
        }
        
        const buffType = cometBuffs[Math.floor(Math.random() * cometBuffs.length)];
        
        gameState.comets.push({
            x: x,
            y: y,
            radius: 15,
            buff: buffType,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }
}

// Update Comets
function updateComets() {
    gameState.comets.forEach(comet => {
        comet.x += comet.vx;
        comet.y += comet.vy;
    });
    
    gameState.comets = gameState.comets.filter(c => 
        c.x > -50 && c.x < gameState.canvas.width + 50 &&
        c.y > -50 && c.y < gameState.canvas.height + 50
    );
}

// Update Particles
function updateParticles() {
    gameState.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
    });
    
    gameState.particles = gameState.particles.filter(p => p.life > 0);
}

// Spawn Boss
function spawnBoss() {
    const planet = planetData[gameState.currentPlanet];
    const difficulty = planet.difficulty;
    
    gameState.boss = {
        x: gameState.canvas.width / 2,
        y: 100,
        width: 150,
        height: 150,
        health: 500 * difficulty,
        maxHealth: 500 * difficulty,
        speed: 2,
        direction: 1,
        lastShot: 0,
        shootCooldown: 1000,
        name: planet.bossName
    };
    
    document.getElementById('bossHealthBar').classList.remove('hidden');
    document.querySelector('.boss-name').textContent = planet.bossName;
}

// Update Boss
function updateBoss() {
    const boss = gameState.boss;
    
    // Move boss
    boss.x += boss.speed * boss.direction;
    if (boss.x <= boss.width/2 || boss.x >= gameState.canvas.width - boss.width/2) {
        boss.direction *= -1;
    }
    
    // Boss shooting
    const now = Date.now();
    if (now - boss.lastShot > boss.shootCooldown) {
        const dx = gameState.player.x - boss.x;
        const dy = gameState.player.y - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            gameState.enemies.push({
                x: boss.x,
                y: boss.y,
                width: 25,
                height: 25,
                speed: 3,
                health: 15,
                maxHealth: 15,
                color: '#FF6600'
            });
        }
        
        boss.lastShot = now;
    }
    
    // Update boss health bar
    const healthPercent = (boss.health / boss.maxHealth) * 100;
    document.querySelector('.health-bar-fill').style.width = healthPercent + '%';
}

// Check Collisions
function checkCollisions() {
    const player = gameState.player;
    
    // Bullets vs Enemies
    gameState.bullets.forEach((bullet, bi) => {
        gameState.enemies.forEach((enemy, ei) => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemy.width/2 + bullet.radius) {
                enemy.health -= bullet.damage;
                gameState.bullets.splice(bi, 1);
                
                // Create particles
                createParticles(enemy.x, enemy.y, '#FF0000');
                
                if (enemy.health <= 0) {
                    gameState.meteoritePieces += 2;
                    updateUpgradeShop(); // Update shop display
                    saveGameData(); // Save immediately
                    gameState.enemies.splice(ei, 1);
                }
            }
        });
        
        // Bullets vs Meteorites
        gameState.meteorites.forEach((meteorite, mi) => {
            const dx = bullet.x - meteorite.x;
            const dy = bullet.y - meteorite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < meteorite.radius + bullet.radius) {
                meteorite.health -= bullet.damage;
                gameState.bullets.splice(bi, 1);
                
                createParticles(meteorite.x, meteorite.y, '#888888');
                
                if (meteorite.health <= 0) {
                    const pieces = Math.floor(meteorite.radius / 10);
                    gameState.meteoritePieces += pieces;
                    updateUpgradeShop(); // Update shop display
                    saveGameData(); // Save immediately
                    createParticles(meteorite.x, meteorite.y, '#FFFF00', 10);
                    gameState.meteorites.splice(mi, 1);
                }
            }
        });
        
        // Bullets vs Boss
        if (gameState.boss) {
            const dx = bullet.x - gameState.boss.x;
            const dy = bullet.y - gameState.boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < gameState.boss.width/2 + bullet.radius) {
                gameState.boss.health -= bullet.damage;
                gameState.bullets.splice(bi, 1);
                createParticles(gameState.boss.x, gameState.boss.y, '#FF0000');
            }
        }
    });
    
    // Player vs Enemies
    if (!player.invincible) {
        gameState.enemies.forEach((enemy, ei) => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.width/2 + enemy.width/2) {
                player.health -= 10;
                player.invincible = true;
                player.invincibleTime = 2000;
                gameState.enemies.splice(ei, 1);
                createParticles(player.x, player.y, '#00FFFF');
            }
        });
        
        // Player vs Meteorites
        gameState.meteorites.forEach((meteorite, mi) => {
            const dx = player.x - meteorite.x;
            const dy = player.y - meteorite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.width/2 + meteorite.radius) {
                player.health -= 15;
                player.invincible = true;
                player.invincibleTime = 2000;
                meteorite.health -= 50;
                createParticles(player.x, player.y, '#00FFFF');
                
                if (meteorite.health <= 0) {
                    gameState.meteorites.splice(mi, 1);
                }
            }
        });
    }
    
    // Player vs Enemy Bullets
    if (!player.invincible) {
        gameState.enemyBullets.forEach((bullet, bi) => {
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.width/2 + bullet.radius) {
                player.health -= bullet.damage;
                player.invincible = true;
                player.invincibleTime = 2000;
                gameState.enemyBullets.splice(bi, 1);
                createParticles(player.x, player.y, '#00FFFF');
            }
        });
    }
    
    // Player vs Comets
    gameState.comets.forEach((comet, ci) => {
        const dx = player.x - comet.x;
        const dy = player.y - comet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.width/2 + comet.radius) {
            applyBuff(comet.buff);
            gameState.comets.splice(ci, 1);
            gameState.achievements.cometRider++;
            createParticles(comet.x, comet.y, comet.buff.color, 15);
        }
    });
    
    // Cosmic Pull effect
    const magnetBuff = gameState.activeBuffs.find(b => b.effect === 'magnet');
    if (magnetBuff) {
        // Attract meteorite pieces (visual effect)
        // In a full implementation, you'd have collectible pieces
    }
}

// Create Particles
function createParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 3,
            color: color,
            life: 30,
            maxLife: 30,
            alpha: 1
        });
    }
}

// Apply Buff
function applyBuff(buff) {
    if (buff.effect === 'invincible') {
        gameState.player.invincible = true;
        gameState.player.invincibleTime = buff.duration;
    }
    
    gameState.activeBuffs.push({
        ...buff,
        startTime: Date.now()
    });
    
    updateBuffDisplay();
}

// Update Buffs
function updateBuffs() {
    const now = Date.now();
    gameState.activeBuffs = gameState.activeBuffs.filter(buff => {
        if (buff.duration === 0) return true; // Permanent until used
        return now - buff.startTime < buff.duration;
    });
    
    // Update invincibility
    if (gameState.player.invincible) {
        const invincibleBuff = gameState.activeBuffs.find(b => b.effect === 'invincible');
        if (!invincibleBuff) {
            gameState.player.invincible = false;
        }
    }
    
    updateBuffDisplay();
}

// Update Buff Display
function updateBuffDisplay() {
    const display = document.getElementById('buffDisplay');
    display.innerHTML = '';
    
    gameState.activeBuffs.forEach(buff => {
        const item = document.createElement('div');
        item.className = 'buff-item';
        item.style.borderColor = buff.color;
        item.textContent = buff.name;
        display.appendChild(item);
    });
}

// Draw Game
function draw() {
    if (!gameState.canvas || !gameState.ctx) return;
    
    const ctx = gameState.ctx;
    const planet = gameState.currentPlanet ? planetData[gameState.currentPlanet] : null;
    
    // Clear canvas completely first (removes all traces)
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw background
    ctx.fillStyle = planet ? planet.color + '20' : '#000011';
    ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw stars
    drawStars();
    
    if (!gameState.player || gameState.isPaused) {
        if (gameState.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
            ctx.fillStyle = '#00FFFF';
            ctx.font = '48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', gameState.canvas.width / 2, gameState.canvas.height / 2);
        }
        return;
    }
    
    // Draw player
    drawPlayer();
    
    // Draw bullets
    gameState.bullets.forEach(bullet => {
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw enemy bullets
    gameState.enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw enemies
    gameState.enemies.forEach(enemy => {
        if (gameState.images.enemy) {
            ctx.drawImage(
                gameState.images.enemy,
                enemy.x - enemy.width/2,
                enemy.y - enemy.height/2,
                enemy.width,
                enemy.height
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height);
        }
    });
    
    // Draw meteorites
    gameState.meteorites.forEach(meteorite => {
        if (gameState.images.meteorite) {
            const size = meteorite.radius * 2;
            ctx.drawImage(
                gameState.images.meteorite,
                meteorite.x - meteorite.radius,
                meteorite.y - meteorite.radius,
                size,
                size
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.arc(meteorite.x, meteorite.y, meteorite.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // Draw comets
    gameState.comets.forEach(comet => {
        ctx.fillStyle = comet.buff.color;
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, comet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw particles
    gameState.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw boss
    if (gameState.boss) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(
            gameState.boss.x - gameState.boss.width/2,
            gameState.boss.y - gameState.boss.height/2,
            gameState.boss.width,
            gameState.boss.height
        );
    }
}

// Draw Stars
function drawStars() {
    const ctx = gameState.ctx;
    ctx.fillStyle = '#FFFFFF';
    
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % gameState.canvas.width;
        const y = (i * 73) % gameState.canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

// Draw Player
function drawPlayer() {
    const player = gameState.player;
    const ctx = gameState.ctx;
    
    if (!gameState.images.player) return; // Wait for image to load
    
    ctx.save();
    
    // Draw spaceship image
    if (player.invincible && Math.floor(player.invincibleTime / 100) % 2) {
        ctx.globalAlpha = 0.5;
    } else {
        ctx.globalAlpha = 1;
    }
    
    const imgWidth = player.width;
    const imgHeight = player.height;
    ctx.drawImage(
        gameState.images.player,
        player.x - imgWidth / 2,
        player.y - imgHeight / 2,
        imgWidth,
        imgHeight
    );
    
    ctx.restore();
}

// Update HUD
function updateHUD() {
    if (!gameState.player) return;
    
    document.getElementById('healthDisplay').textContent = Math.max(0, Math.floor(gameState.player.health));
    const minutes = Math.floor(gameState.gameTime / 60000);
    const seconds = Math.floor((gameState.gameTime % 60000) / 1000);
    document.getElementById('timeDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('piecesDisplay').textContent = gameState.meteoritePieces;
    
    // Auto-save periodically (every 5 seconds) to prevent data loss
    if (gameState.gameTime % 5000 < 16) {
        saveGameData();
    }
}

// Show Dialogue
function showDialogue(title, text) {
    document.getElementById('dialogueTitle').textContent = title;
    document.getElementById('dialogueText').textContent = text;
    document.getElementById('dialogueBox').classList.remove('hidden');
    gameState.isPaused = true;
    
    // Collect fact
    if (!gameState.collectedFacts.includes(gameState.currentPlanet)) {
        gameState.collectedFacts.push(gameState.currentPlanet);
        gameState.achievements.planetScholar++;
        updateFactCollection();
        updateAchievements();
    }
}

function closeDialogue() {
    document.getElementById('dialogueBox').classList.add('hidden');
    gameState.isPaused = false;
}

// Toggle Pause
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

// Game Over
function gameOver(victory) {
    gameState.isGameOver = true;
    gameState.isPaused = true;
    
    const planet = planetData[gameState.currentPlanet];
    
    if (victory) {
        document.getElementById('gameOverTitle').textContent = 'Planet Conquered!';
        document.getElementById('gameOverText').textContent = `You've successfully completed ${planet.name}!`;
        
        // Planets are now unlocked with meteorite pieces, not by completing previous planets
        // But we still check achievements
        
        // Check achievements
        if (gameState.unlockedPlanets.length >= 9) {
            gameState.achievements.orbitBreaker = true;
        }
        
        if (gameState.collectedFacts.length >= 9) {
            gameState.achievements.solarScholar = true;
        }
        
        updatePlanetSelect();
        updateAchievements();
    } else {
        document.getElementById('gameOverTitle').textContent = 'Mission Failed';
        document.getElementById('gameOverText').textContent = `You were defeated on ${planet.name}. Try again!`;
    }
    
    // Show stats
    const stats = document.getElementById('gameOverStats');
    stats.innerHTML = `
        <p>Time Survived: ${Math.floor(gameState.gameTime / 60000)}:${Math.floor((gameState.gameTime % 60000) / 1000).toString().padStart(2, '0')}</p>
        <p>Meteorite Pieces Collected: ${gameState.meteoritePieces}</p>
    `;
    
    saveGameData();
    showScreen('gameOverScreen');
}

// Upgrade Shop
function buyUpgrade(type) {
    const cost = getUpgradeCost(type);
    if (gameState.meteoritePieces >= cost) {
        gameState.meteoritePieces -= cost;
        gameState.upgrades[type]++;
        updateUpgradeShop();
        saveGameData();
    } else {
        alert('Not enough meteorite pieces!');
    }
}

function getUpgradeCost(type) {
    const level = gameState.upgrades[type];
    return 10 * Math.pow(2, level - 1);
}

function updateUpgradeShop() {
    document.getElementById('meteoritePieces').textContent = gameState.meteoritePieces;
    document.getElementById('damageLevel').textContent = gameState.upgrades.damage;
    document.getElementById('damageCost').textContent = getUpgradeCost('damage');
    document.getElementById('speedLevel').textContent = gameState.upgrades.speed;
    document.getElementById('speedCost').textContent = getUpgradeCost('speed');
    document.getElementById('rocketSpeedLevel').textContent = gameState.upgrades.rocketSpeed;
    document.getElementById('rocketSpeedCost').textContent = getUpgradeCost('rocketSpeed');
    document.getElementById('healthLevel').textContent = gameState.upgrades.health;
    document.getElementById('healthCost').textContent = getUpgradeCost('health');
}

// Update Planet Select
function updatePlanetSelect() {
    // Update currency display
    const piecesDisplay = document.getElementById('planetSelectPieces');
    if (piecesDisplay) {
        piecesDisplay.textContent = gameState.meteoritePieces;
    }
    
    document.querySelectorAll('.planet-card').forEach(card => {
        const planetKey = card.dataset.planet;
        const planet = planetData[planetKey];
        const status = card.querySelector('.planet-status');
        
        if (gameState.unlockedPlanets.includes(planetKey)) {
            card.classList.remove('locked');
            card.classList.add('unlocked');
            status.textContent = 'Unlocked';
            status.classList.remove('locked');
            status.classList.add('unlocked');
        } else {
            card.classList.add('locked');
            card.classList.remove('unlocked');
            status.textContent = `Locked (${planet.unlockCost} pieces)`;
            status.classList.add('locked');
            status.classList.remove('unlocked');
        }
    });
}

// Update Fact Collection
function updateFactCollection() {
    const factList = document.getElementById('factList');
    factList.innerHTML = '';
    
    Object.keys(planetData).forEach(planetKey => {
        const planet = planetData[planetKey];
        const factItem = document.createElement('div');
        factItem.className = 'fact-item';
        
        if (gameState.collectedFacts.includes(planetKey)) {
            factItem.innerHTML = `
                <h3>${planet.name}</h3>
                <p>${planet.fact}</p>
            `;
        } else {
            factItem.innerHTML = `
                <h3>${planet.name}</h3>
                <p>??? (Complete this planet to unlock)</p>
            `;
        }
        
        factList.appendChild(factItem);
    });
}

// Update Achievements
function updateAchievements() {
    const achievementList = document.getElementById('achievementList');
    achievementList.innerHTML = '';
    
    const achievements = [
        { id: 'orbitBreaker', name: 'Orbit Breaker', desc: 'Clear all planets', unlocked: gameState.achievements.orbitBreaker },
        { id: 'solarScholar', name: 'Solar Scholar', desc: 'Collect all facts', unlocked: gameState.achievements.solarScholar },
        { id: 'cometRider', name: 'Comet Rider', desc: `Collect ${gameState.achievements.cometRider}/100 comet buffs`, unlocked: gameState.achievements.cometRider >= 100 },
        { id: 'planetScholar', name: 'Planet Scholar', desc: `Collect ${gameState.achievements.planetScholar}/9 planet facts`, unlocked: gameState.achievements.planetScholar >= 9 },
        { id: 'ironRocket', name: 'Iron Rocket', desc: 'Survive without upgrades', unlocked: gameState.achievements.ironRocket }
    ];
    
    achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        item.innerHTML = `
            <h3>${achievement.name}</h3>
            <p>${achievement.desc}</p>
            ${achievement.unlocked ? '<span style="color: #00ff00;">✓ Unlocked</span>' : '<span style="color: #ff0000;">Locked</span>'}
        `;
        achievementList.appendChild(item);
    });
}

// Save/Load Game Data
function saveGameData() {
    const data = {
        unlockedPlanets: gameState.unlockedPlanets,
        upgrades: gameState.upgrades,
        meteoritePieces: gameState.meteoritePieces,
        collectedFacts: gameState.collectedFacts,
        achievements: gameState.achievements
    };
    localStorage.setItem('mindOrbitSave', JSON.stringify(data));
}

function loadGameData() {
    const saved = localStorage.getItem('mindOrbitSave');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.unlockedPlanets = data.unlockedPlanets || ['mercury'];
        gameState.upgrades = data.upgrades || { damage: 1, speed: 1, rocketSpeed: 1, health: 1 };
        gameState.meteoritePieces = data.meteoritePieces || 0;
        gameState.collectedFacts = data.collectedFacts || [];
        gameState.achievements = { ...gameState.achievements, ...(data.achievements || {}) };
    }
}

// Show Menu Options (from Start button)
function showMenuOptions() {
    const menuOptions = document.getElementById('menuOptions');
    if (menuOptions) {
        menuOptions.classList.remove('hidden');
    }
}

// Hide Menu Options (back to starting screen)
function hideMenuOptions() {
    const menuOptions = document.getElementById('menuOptions');
    if (menuOptions) {
        menuOptions.classList.add('hidden');
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    initGame();

    // Add click handler for Start button
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', showMenuOptions);
    }
});
