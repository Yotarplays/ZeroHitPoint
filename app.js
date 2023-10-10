const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speed: 5,
    gun: {
        damage: 1,
        fireRate: 1, // This can be used later if you want to increase the fire rate
        cooldown: 1000, // 1000 milliseconds = 1 second
        lastShot: 0
    },
};

let highScore = localStorage.getItem('highScore') || 0;
let currentWave = 1;
let enemiesToSpawn = 5; // Initial number of enemies for the first wave
let enemiesSpawned = 0;
let waveInProgress = false;

let gamePaused = false;
let availableUpgrades = [
    { name: "Increase Speed       ", cost: 10, action: () => player.speed += 1 },
    { name: "Increase Gun Damage  ", cost: 20, action: () => player.gun.damage += 1 },
    { name: "Increase Reload Speed", cost: 30, action: () => player.gun.cooldown -= 5}
];

let enemies = [];
let bullets = [];
let coins = 0;
let keys = {};

// Event listeners for player movement
document.addEventListener('keydown', function (event) {
    keys[event.code] = true;
    if (event.code === 'Space') shootBullet();
});

document.addEventListener('keyup', function (event) {
    keys[event.code] = false;
});

document.addEventListener('keydown', function (event) {
    if (event.code === 'KeyE' && gamePaused) {
        resumeGame();
    }
});

function movePlayer() {
    if ((keys['ArrowUp'] || keys['KeyW']) && player.y > 10) player.y -= player.speed;
    if ((keys['ArrowDown'] || keys['KeyS']) && player.y < canvas.height - 10) player.y += player.speed;
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 10) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - 10) player.x += player.speed;
}

function checkWaveCompletion() {
    if (waveInProgress && enemies.length === 0 && enemiesSpawned >= enemiesToSpawn) {
        waveInProgress = false;
        currentWave++;
        enemiesToSpawn = Math.floor(enemiesToSpawn * 1.5);
        enemiesSpawned = 0;
        pauseGame(); // Pause the game after a wave is completed
        updateWaveCounter();
    }
    if (currentWave > highScore) {
        highScore = currentWave;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }
}

function resetHighScore() {
    localStorage.removeItem('highScore'); // This will remove the high score
    // or
    // localStorage.setItem('highScore', '0'); // This will set the high score to 0
    highScore = 0;
    updateHighScoreDisplay();
}


function updateWaveCounter() {
    const waveDisplay = document.getElementById('waveCounter'); // Assuming you have an HTML element with this id.
    if (waveDisplay) {
        waveDisplay.textContent = "Wave: " + currentWave;
    }
}


function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = "High Score: " + highScore;
}

function pauseGame() {
    gamePaused = true;
    displayUpgrades();
}

function resumeGame() {
    let upgradesDiv = document.getElementById('upgrades');
    upgradesDiv.innerHTML = ''; // Clear the upgrades
    gamePaused = false;
    gameLoop();
}

function displayUpgrades() {
    let upgradesDiv = document.getElementById('upgrades');
    upgradesDiv.innerHTML = ''; // Clear previous upgrades

    availableUpgrades.forEach(upgrade => {
        let upgradeContainer = document.createElement('div');
        upgradeContainer.style.display = 'flex';
        upgradeContainer.style.alignItems = 'center';
        upgradeContainer.style.gap = '10px';

        let button = document.createElement('button');
        button.textContent = `${upgrade.name} (Cost: ${upgrade.cost} coins)`;
        button.onclick = function () {
            if (coins >= upgrade.cost) {
                coins -= upgrade.cost;
                upgrade.action();
                updateScoreDisplay();
            } else {
                let noMoneyMsg = document.createElement('span');
                noMoneyMsg.textContent = "You have no money!";
                noMoneyMsg.style.color = 'red';
                upgradeContainer.appendChild(noMoneyMsg);

                // Optionally, remove the message after a few seconds
                setTimeout(() => {
                    if (noMoneyMsg.parentNode) {
                        noMoneyMsg.parentNode.removeChild(noMoneyMsg);
                    }
                }, 2000);
            }
        };
        upgradeContainer.appendChild(button);
        upgradesDiv.appendChild(upgradeContainer);
    });


    // Add the continue button
    let continueButton = document.createElement('button');
    continueButton.textContent = "Continue to Next Wave";
    continueButton.onclick = function () {
        upgradesDiv.innerHTML = ''; // Clear upgrades and continue button
        resumeGame(); // Resume the game after selecting an upgrade or continue button
    };
    upgradesDiv.appendChild(continueButton);
}


function spawnEnemies() {
    if (!waveInProgress && enemies.length === 0) {
        waveInProgress = true;
    }

    if (waveInProgress && enemiesSpawned < enemiesToSpawn) {
        if (Math.random() < 0.02) { // 2% chance to spawn an enemy every frame
            let side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let enemy = {
                x: 0,
                y: 0,
                speed: 0.5 + Math.random() * 3
            };

            switch (side) {
                case 0: // top
                    enemy.x = Math.random() * canvas.width;
                    break;
                case 1: // right
                    enemy.x = canvas.width;
                    enemy.y = Math.random() * canvas.height;
                    break;
                case 2: // bottom
                    enemy.x = Math.random() * canvas.width;
                    enemy.y = canvas.height;
                    break;
                case 3: // left
                    enemy.y = Math.random() * canvas.height;
                    break;
            }

            enemies.push(enemy);  // Move this line inside the if block
            enemiesSpawned++;
        }
    }
}

document.getElementById("restartButton").addEventListener("click", function () {
    // Hide the death screen
    document.getElementById("deathScreen").style.display = "none";
    console.log("Restart button clicked!")
    // Call your game restart function
    restartGame();
});


function playerDied() {
    gamePaused = true;  // Pause the game
    document.getElementById("deathScreen").style.display = "block";
    console.log("Player died!")
}



function restartGame() {
    document.getElementById("deathScreen").style.display = "none";
    console.log("Restarting game...")
    // Reset player and game state
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    coins = 0;
    currentWave = 1;
    enemiesToSpawn = 5;
    enemiesSpawned = 0;
    waveInProgress = false;
    enemies = [];
    bullets = [];
    updateScoreDisplay();
    updateWaveCounter();

    

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = 'white'; // Set a white fill color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with white
    gamePaused = false;
    gameLoop();  // Start the game loop again
}




function moveEnemies() {
    for (let enemy of enemies) {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        if (Math.abs(player.x - enemy.x) < 20 && Math.abs(player.y - enemy.y) < 20) { // Assuming player and enemy have a width and height of 20
            playerDied();
            return;
        }
    }
}

function findNearestEnemy() {
    let nearestEnemy = null;
    let nearestDistance = Infinity;

    for (let enemy of enemies) {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    }

    return nearestEnemy;
}

function shootBullet() {
    let currentTime = Date.now();
    if (currentTime - player.gun.lastShot < player.gun.cooldown) {
        // If the time since the last shot is less than the cooldown, don't shoot
        return;
    }

    let nearestEnemy = findNearestEnemy();

    if (nearestEnemy) {
        let dx = nearestEnemy.x - player.x;
        let dy = nearestEnemy.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        let bullet = {
            x: player.x,
            y: player.y,
            dx: dx / distance,
            dy: dy / distance,
            speed: 7
        };

        bullets.push(bullet);
        player.gun.lastShot = currentTime; // Update the lastShot timestamp
    }
}

function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dx * bullets[i].speed;
        bullets[i].y += bullets[i].dy * bullets[i].speed;

        // Remove bullets that go out of the canvas
        if (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

function checkBulletCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (bullets[i].x > enemies[j].x - 10 && bullets[i].x < enemies[j].x + 10 &&
                bullets[i].y > enemies[j].y - 10 && bullets[i].y < enemies[j].y + 10) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                coins += 10;
                updateScoreDisplay();
                break;
            }
        }
    }
}

function draw() {
    if (gamePaused) return;  // Don't draw anything if the game is paused

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x - 10, player.y - 10, 20, 20); // Assuming player size to be 20x20

    // Draw enemies
    ctx.fillStyle = 'red';
    for (let enemy of enemies) {
        ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20); // Assuming enemy size to be 20x20
    }

    // Draw bullets
    ctx.fillStyle = 'black';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10); // Bullet size
    }
}


function gameLoop() {
    if (gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    if (keys['Space']) {
        shootBullet();
    }
    spawnEnemies();
    moveEnemies();
    moveBullets();
    checkBulletCollisions();
    checkWaveCompletion();
    draw();

    if (!gamePaused) { // Only request a new frame if the game is not paused
        requestAnimationFrame(gameLoop);
    }
}



function upgradeGun() {
    if (coins >= 10) {
        player.gun.damage += 1;
        coins -= 10;
        updateScoreDisplay();
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = "Coins: " + coins;
}

function goToHomePage() {
    window.location.href = "index.html"; // Redirects to the root of your website
}

updateHighScoreDisplay();
gameLoop();
