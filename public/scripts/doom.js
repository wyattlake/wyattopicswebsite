const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");

map =
    "000000000001221\n" +
    "0          1  1\n" +
    "0          1  1\n" +
    "0          1  1\n" +
    "0          1  1\n" +
    "222222     1  1\n" +
    "1          1  1\n" +
    "1          1  1\n" +
    "1          1  1\n" +
    "1             1\n" +
    "1111111       1\n" +
    "1             1\n" +
    "1             1\n" +
    "1             1\n" +
    "101010101010101";

lines = map.split("\n");
tileSize = mapCanvas.height / lines.length;

// Player variables
playerX = 1.7;
playerY = 1.5;
playerAngle = 1;

// Player controller variables
movingForward = false;
movingBackward = false;
turningLeft = false;
turningRight = false;

// Rendering constants
const frameDelay = 40;
const fov = Math.PI / 3.0;
const maxDistance = lines.length * 1.5;
const rayCount = 60;
const rayStep = 0.05;
const textureResolution = 64;
const canvasScale = gameCanvas.width / rayCount;

depthMap = new Array(rayCount);

// Player constants
const walkSpeed = 0.003;
const turnSpeed = 0.0015;

// Map Constants
const playerSize = 10;
const enemySize = 10;

class Sprite {
    constructor(x, y, textureSource) {
        this.x = x;
        this.y = y;
        this.resolution = textureResolution;
        this.texture = loadTexture(
            textureResolution,
            textureResolution,
            textureSource
        );
        this.distance = 0;
    }

    loadSpriteTextureData() {
        this.textureData = new Array(this.resolution)
            .fill(null)
            .map(() => new Array(this.resolution).fill(null));
        for (let i = 0; i < this.resolution; i++) {
            for (let j = 0; j < this.resolution; j++) {
                this.textureData[i][j] = this.getPixelRaw(i, j);
            }
        }
    }

    getPixelRaw(x, y) {
        return this.texture.getImageData(x, y, 1, 1).data;
    }

    updateDistance() {
        this.distance = Math.sqrt(
            Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2)
        );
    }
}

function projectMapToCanvas() {
    for (let row = 0; row < lines.length; row++) {
        for (let col = 0; col < lines[row].length; col++) {
            const char = lines[row][col];

            switch (char) {
                case " ":
                    mapCtx.fillStyle = "white";
                    break;
                case "0":
                    mapCtx.fillStyle = "green";
                    break;
                case "1":
                    mapCtx.fillStyle = "blue";
                    break;
                case "2":
                    mapCtx.fillStyle = "red";
                    break;
            }

            mapCtx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }
}

function drawPlayer(x, y) {
    mapCtx.fillStyle = "green"; // Color of the player
    mapCtx.fillRect(
        x * tileSize - playerSize / 2,
        y * tileSize - playerSize / 2,
        playerSize,
        playerSize
    );
}

function drawMapEnemies(enemies) {
    mapCtx.fillStyle = "red";

    for (i = 0; i < enemies.length; i++) {
        enemy = enemies[i];
        mapCtx.fillRect(
            enemy.x * tileSize - enemySize / 2,
            enemy.y * tileSize - enemySize / 2,
            enemySize,
            enemySize
        );
    }
}

function getValueFromMap(map, x, y) {
    const ys = map.split("\n");

    if (y >= 0 && y < ys.length && x >= 0 && x < ys[y].length) {
        return ys[y][x];
    }

    return null;
}

function castRay(playerX, playerY, playerAngle) {
    const rayX = playerX;
    const rayY = playerY;

    mapCtx.fillStyle = "black"; // Color for the ray

    for (let distance = 0; distance < maxDistance; distance += rayStep) {
        const testX = rayX + Math.cos(playerAngle) * distance;
        const testY = rayY + Math.sin(playerAngle) * distance;

        mapValue = getValueFromMap(map, Math.floor(testX), Math.floor(testY));

        if (mapValue != " ") {
            return [distance, mapValue];
        }
    }
    return null;
}

function drawPlayerPerspective(playerX, playerY, playerAngle, fov) {
    for (i = 0; i < rayCount; i++) {
        angle = playerAngle - fov / 2 + fov * (i / rayCount);
        result = castRay(playerX, playerY, angle);

        if (result != null) {
            distance = result[0];
            hitObject = result[1];

            fisheye_fix = Math.cos(angle - playerAngle);
            wallHeight = gameCanvas.height / (distance * fisheye_fix);

            intensity = 1 - distance / maxDistance;

            switch (hitObject) {
                case "0":
                    gameCtx.fillStyle = `rgb(0, ${255 * intensity}, 0)`;
                    break;
                case "1":
                    gameCtx.fillStyle = `rgb(0, 0, ${255 * intensity})`;
                    break;
                case "2":
                    gameCtx.fillStyle = `rgb(${255 * intensity}, 0, 0)`;
                    break;
            }

            gameCtx.fillRect(
                i * canvasScale,
                (gameCanvas.height - wallHeight) / 2,
                canvasScale,
                wallHeight
            );

            depthMap[i] = distance;
        }
    }
}

function drawSprite(sprite) {
    spriteAngle = Math.atan2(sprite.y - playerY, sprite.x - playerX);

    while (spriteAngle - playerAngle > Math.PI) spriteAngle -= 2 * Math.PI;
    while (spriteAngle - playerAngle < -Math.PI) spriteAngle += 2 * Math.PI;

    spriteSize = gameCanvas.width / sprite.distance;

    xOffset =
        ((spriteAngle - playerAngle) / fov) * gameCanvas.width +
        gameCanvas.width / 2 -
        spriteSize / 2;
    yOffset = gameCanvas.width / 2 - spriteSize / 2;

    pixelScale = spriteSize / sprite.resolution;

    for (i = 0; i < sprite.resolution; i++) {
        pixelXOffset = xOffset + i * pixelScale;
        if (depthMap[Math.floor(pixelXOffset / canvasScale)] < sprite.distance)
            continue;
        if (pixelXOffset + pixelScale > 0 && pixelXOffset <= gameCanvas.width) {
            for (j = 0; j < sprite.resolution; j++) {
                pixelYOffset = yOffset + j * pixelScale;
                if (
                    pixelXOffset + pixelScale > 0 &&
                    pixelYOffset <= gameCanvas.height
                ) {
                    if (sprite.textureData == null) {
                        sprite.loadSpriteTextureData();
                    }

                    texturePixel = sprite.textureData[i][j];

                    intensity = 1 - sprite.distance / maxDistance;

                    if (texturePixel[3] > 200) {
                        gameCtx.fillStyle = `rgb(${
                            texturePixel[0] * intensity
                        }, ${texturePixel[1] * intensity}, ${
                            texturePixel[2] * intensity
                        })`;
                        gameCtx.fillRect(
                            pixelXOffset - 1,
                            pixelYOffset,
                            pixelScale + 1,
                            pixelScale + 1
                        );
                    }
                }
            }
        }
    }
}

function drawEnemies(enemies) {
    enemies.sort(function (x, y) {
        if (x.distance < y.distance) {
            return 1;
        } else if (x.distance > y.distance) {
            return -1;
        } else {
            return 0;
        }
    });
    for (enemyIdx = 0; enemyIdx < enemies.length; enemyIdx++) {
        drawSprite(enemies[enemyIdx]);
    }
}

function clearCanvas(canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function drawScene() {
    clearCanvas(gameCanvas, gameCtx);
    clearCanvas(mapCanvas, mapCtx);

    gameCtx.fillStyle = "black";
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    const grd = gameCtx.createLinearGradient(0, 0, 0, gameCanvas.height);
    grd.addColorStop(1, "rgb(255, 255, 255)");

    grd.addColorStop(0.5, `rgb(100, 100, 100)`);
    grd.addColorStop(0, "rgb(255, 255, 255)");

    // Fill with gradient
    gameCtx.fillStyle = grd;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    projectMapToCanvas(map);

    drawPlayerPerspective(playerX, playerY, playerAngle, fov);
    drawPlayer(playerX, playerY);

    drawEnemies(enemies);
    drawMapEnemies(enemies);
}

function updateEnemies() {
    for (enemyIdx = 0; enemyIdx < enemies.length; enemyIdx++) {
        enemies[enemyIdx].updateDistance();
    }
}

function updatePosition(timeElapsed) {
    const walkSpeedFactor = walkSpeed * timeElapsed;
    const turnSpeedFactor = turnSpeed * timeElapsed;

    if (movingForward) {
        newPlayerX = playerX + walkSpeedFactor * Math.cos(playerAngle);
        newPlayerY = playerY + walkSpeedFactor * Math.sin(playerAngle);

        if (
            getValueFromMap(
                map,
                Math.floor(newPlayerX),
                Math.floor(newPlayerY)
            ) == " "
        ) {
            playerX = newPlayerX;
            playerY = newPlayerY;
        }
    }
    if (movingBackward) {
        newPlayerX = playerX - walkSpeedFactor * Math.cos(playerAngle);
        newPlayerY = playerY - walkSpeedFactor * Math.sin(playerAngle);

        if (
            getValueFromMap(
                map,
                Math.floor(newPlayerX),
                Math.floor(newPlayerY)
            ) == " "
        ) {
            playerX = newPlayerX;
            playerY = newPlayerY;
        }
    }

    if (turningLeft) {
        playerAngle -= turnSpeedFactor;
    }

    if (turningRight) {
        playerAngle += turnSpeedFactor;
    }
}

function loadTexture(width, height, src) {
    let textureCanvas = document.getElementById("textureCanvas");
    let textureContext = textureCanvas.getContext("2d");
    const image = new Image(width, height);
    image.onload = drawImage;
    image.src = src;

    return textureContext;
}

function drawImage() {
    let canvas = document.getElementById("textureCanvas");
    let ctx = canvas.getContext("2d");
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.drawImage(this, 0, 0, this.width, this.height);
}

async function gameLoop() {
    pastTime = performance.now();
    while (true) {
        const currentTime = performance.now();
        const timeElapsed = currentTime - pastTime;

        const renderStartTime = performance.now();
        updatePosition(timeElapsed);
        updateEnemies();
        drawScene();
        const renderEndTime = performance.now();
        const renderTime = renderEndTime - renderStartTime;

        if (renderTime < frameDelay) {
            await sleep(frameDelay - renderTime);
        } else {
            await sleep(1);
        }

        pastTime = currentTime;
    }
}

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "w":
            movingForward = true;
            break;
        case "s":
            movingBackward = true;
            break;
        case "a":
            turningLeft = true;
            break;
        case "d":
            turningRight = true;
            break;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "w":
            movingForward = false;
            break;
        case "s":
            movingBackward = false;
            break;
        case "a":
            turningLeft = false;
            break;
        case "d":
            turningRight = false;
            break;
    }
});

enemies = [
    new Sprite(5.0, 2.0, "images/alexTexture.png"),
    new Sprite(6.0, 3.0, "images/alexTexture.png"),
];

gameLoop();
