const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Set the new ground level to 1/3rd up from the bottom of the screen
const groundLevel = canvas.height - canvas.height / 3;

const player = {
    x: 50,
    y: groundLevel - 50,
    width: 50,
    height: 50,
    velocityY: 0,
    gravity: 1.5,
    maxJumpHeight: 200, // Max height of the jump
    initialJumpPower: -20, // Initial jump power, adjusted for desired height
    jumpHoldTime: 0, // Time the spacebar is held
    maxJumpHoldTime: 0.5, // Maximum time to hold the spacebar
    isJumping: false,
    isHoldingJump: false,
    maxHeightReached: false
};

let baseSpeed = 10;
let baseObstacleWidth = 50;
let baseObstacleHeight = 50;

let obstacles = [];
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Cloud configuration
const clouds = [];
const cloudCount = 5; // Number of clouds to generate

function resetGame() {
    player.y = groundLevel - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.isHoldingJump = false;
    player.jumpHoldTime = 0;
    player.maxHeightReached = false;
    obstacles = [];
    clouds.length = 0;
    gameOver = false;
    score = 0;
}

function update(deltaTime) {
    let currentSpeed = baseSpeed + Math.floor(score / 100);
    let currentObstacleWidth = baseObstacleWidth + Math.floor(score / 200);
    let currentObstacleHeight = baseObstacleHeight + Math.floor(score / 200);

    // Handle jump
    if (player.isHoldingJump) {
        if (!player.maxHeightReached) {
            if (player.jumpHoldTime < player.maxJumpHoldTime) {
                player.jumpHoldTime += deltaTime;
            }
            let jumpProgress = player.jumpHoldTime / player.maxJumpHoldTime;
            player.velocityY = player.initialJumpPower * (1 - jumpProgress); // Decrease the jump power as time goes by
        }
    } else {
        if (player.y <= groundLevel - player.height - player.maxJumpHeight) {
            player.maxHeightReached = true;
        }
        if (player.maxHeightReached) {
            player.velocityY += player.gravity;
        }
    }

    player.y += player.velocityY;

    // Ensure the player doesn't go below the ground level
    if (player.y > groundLevel - player.height) {
        player.y = groundLevel - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        player.jumpHoldTime = 0;
        player.maxHeightReached = false;
    }

    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    let passedObstacles = [];
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= currentSpeed;

        if (obstacles[i].x + obstacles[i].width < 0) {
            passedObstacles.push(i);
            score += 10;
        }

        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
        }
    }

    for (let i = passedObstacles.length - 1; i >= 0; i--) {
        obstacles.splice(passedObstacles[i], 1);
    }

    if (Math.random() < 0.01) {
        obstacles.push({
            x: canvas.width,
            y: groundLevel - currentObstacleHeight,
            width: currentObstacleWidth,
            height: currentObstacleHeight,
            speed: currentSpeed
        });
    }

    // Update cloud positions
    for (let cloud of clouds) {
        cloud.x -= currentSpeed * 0.5;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
        }
    }

    // Add new clouds occasionally
    if (Math.random() < 0.01) {
        clouds.push({
            x: canvas.width,
            y: Math.random() * (groundLevel - 100),
            width: 100,
            height: 60,
            cloudColor: 'white'
        });
    }
}

function drawEllipse(ctx, x, y, width, height, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundLevel);
    skyGradient.addColorStop(0, '#87CEEB'); // Light blue
    skyGradient.addColorStop(1, '#4682B4'); // Darker blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, groundLevel);

    // Draw clouds
    for (let cloud of clouds) {
        drawEllipse(ctx, cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, cloud.cloudColor); // Draw cloud as an ellipse
    }

    // Draw mud
    ctx.fillStyle = '#8B4513'; // Mud color
    ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);

    // Draw the horizon line
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundLevel);
    ctx.lineTo(canvas.width, groundLevel);
    ctx.stroke();

    // Draw player
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw obstacles
    ctx.fillStyle = 'green';
    for (let i = 0; i < obstacles.length; i++) {
        ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
    }

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 20, 30);
    ctx.fillText('High Score: ' + highScore, 20, 60);

    // Draw game over
    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '48px serif';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Press Space to Restart', canvas.width / 2 - 130, canvas.height / 2 + 50);
    }
}

let lastTime = 0;
function loop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!gameOver) {
        update(deltaTime);
    }
    draw();
    requestAnimationFrame(loop);
}

// Handle key down for jump start
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!player.isJumping) {
            player.isJumping = true;
            player.isHoldingJump = true;
            player.jumpHoldTime = 0;
            player.velocityY = 0; // Reset velocity to 0 when starting jump
            player.maxHeightReached = false;
        }
    }
});

// Handle key up for jump release
document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        player.isHoldingJump = false; // Stop the jump when space is released
    }
});

loop();
