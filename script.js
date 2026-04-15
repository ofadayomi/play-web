const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('current-score');
const currentStageEl = document.getElementById('current-stage');
const highScoreDisplay = document.getElementById('high-score-display');

const stages = [
    { numTargets: 5, bombs: 10, bombSpeed: 3, planeSpeed: 5 },
    { numTargets: 6, bombs: 9, bombSpeed: 3.5, planeSpeed: 4.5 },
    { numTargets: 7, bombs: 8, bombSpeed: 4, planeSpeed: 4 },
    { numTargets: 8, bombs: 7, bombSpeed: 4.5, planeSpeed: 3.5 },
    { numTargets: 9, bombs: 6, bombSpeed: 5, planeSpeed: 3 }
];

let currentStage = 0;

const plane = {
    x: canvas.width / 2 - 25,
    y: 50,
    width: 50,
    height: 30,
    speed: stages[0].planeSpeed
};

let bombs = [];
let targets = [];
let score = 0;
let bombsLeft = stages[0].bombs;
let gameOver = false;
let keys = {};
let started = false;
let bombSpeed = stages[0].bombSpeed;

const targetWidth = 60;
const targetHeight = 40;
function initTargets() {
    const numTargets = stages[currentStage].numTargets;
    targets = [];
    for (let i = 0; i < numTargets; i++) {
        targets.push({
            x: i * (canvas.width / numTargets),
            y: canvas.height - targetHeight - 20,
            width: targetWidth,
            height: targetHeight,
            hit: false
        });
    }
}

initTargets();

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !gameOver && bombsLeft > 0) {
        bombs.push({
            x: plane.x + plane.width / 2 - 5,
            y: plane.y + plane.height,
            dy: bombSpeed,
            width: 10,
            height: 10
        });
        bombsLeft--;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Update game
function update() {
    if (!started || gameOver) return;

    // Move plane
    if (keys['ArrowLeft'] && plane.x > 0) {
        plane.x -= plane.speed;
    }
    if (keys['ArrowRight'] && plane.x < canvas.width - plane.width) {
        plane.x += plane.speed;
    }

    // Move bombs
    bombs.forEach((bomb, index) => {
        bomb.y += bomb.dy;
        if (bomb.y > canvas.height) {
            bombs.splice(index, 1);
        }
    });

    // Check collisions
    bombs.forEach((bomb, bIndex) => {
        targets.forEach((target, tIndex) => {
            if (!target.hit &&
                bomb.x < target.x + target.width &&
                bomb.x + bomb.width > target.x &&
                bomb.y < target.y + target.height &&
                bomb.y + bomb.height > target.y) {
                target.hit = true;
                bombs.splice(bIndex, 1);
                score += 10;
                currentScoreEl.textContent = score;
            }
        });
    });

    // Check if all targets hit or no bombs left
    const allHit = targets.every(t => t.hit);
    if (allHit) {
        if (currentStage < 4) {
            nextStage();
        } else {
            gameOver = true;
            checkHighScore();
        }
    } else if (bombsLeft === 0) {
        gameOver = true;
        checkHighScore();
    }
}

// Draw game
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!started) {
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Click "Lets play" to start', canvas.width / 2 - 200, canvas.height / 2);
        return;
    }

    // Draw plane
    ctx.fillStyle = 'gray';
    ctx.fillRect(plane.x, plane.y, plane.width, plane.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(plane.x + 10, plane.y + 5, 30, 10); // Cockpit

    // Draw bombs
    ctx.fillStyle = 'red';
    bombs.forEach(bomb => {
        ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
    });

    // Draw targets
    targets.forEach(target => {
        if (!target.hit) {
            ctx.fillStyle = 'green';
            ctx.fillRect(target.x, target.y, target.width, target.height);
        }
    });

    // Draw UI
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Bombs left: ${bombsLeft}`, 10, 30);
    if (gameOver) {
        ctx.fillText('Game Over! Press R to restart', canvas.width / 2 - 150, canvas.height / 2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// Next stage
function nextStage() {
    currentStage++;
    plane.speed = stages[currentStage].planeSpeed;
    bombSpeed = stages[currentStage].bombSpeed;
    bombsLeft = stages[currentStage].bombs;
    initTargets();
    currentStageEl.textContent = currentStage + 1;
}

// Restart
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && gameOver) {
        resetGame();
    }
});

function resetGame() {
    currentStage = 0;
    plane.x = canvas.width / 2 - 25;
    plane.speed = stages[0].planeSpeed;
    bombSpeed = stages[0].bombSpeed;
    bombs = [];
    initTargets();
    score = 0;
    bombsLeft = stages[0].bombs;
    gameOver = false;
    currentScoreEl.textContent = score;
    currentStageEl.textContent = 1;
}

// High score management
function loadHighScores() {
    const stored = localStorage.getItem('bomberHighScores');
    return stored ? JSON.parse(stored) : [];
}

function saveHighScores(scores) {
    localStorage.setItem('bomberHighScores', JSON.stringify(scores));
}

function getWeeklyHighScore() {
    const scores = loadHighScores();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScores = scores.filter(s => new Date(s.date) > weekAgo);
    if (weeklyScores.length === 0) return null;
    return weeklyScores.reduce((max, s) => s.score > max.score ? s : max);
}

function displayHighScore() {
    const high = getWeeklyHighScore();
    if (high) {
        highScoreDisplay.textContent = `${high.name} from ${high.location}: ${high.score}`;
    } else {
        highScoreDisplay.textContent = 'No high score yet';
    }
}

function checkHighScore() {
    const currentHigh = getWeeklyHighScore();
    if (!currentHigh || score > currentHigh.score) {
        const name = prompt('New high score! Enter your name:');
        const location = prompt('Enter your location:');
        if (name && location) {
            const scores = loadHighScores();
            scores.push({ score, name, location, date: new Date().toISOString() });
            saveHighScores(scores);
            displayHighScore();
        }
    }
}

// Initial display
displayHighScore();

// Start button
document.getElementById('start-btn').addEventListener('click', () => {
    started = true;
    document.getElementById('start-btn').style.display = 'none';
});