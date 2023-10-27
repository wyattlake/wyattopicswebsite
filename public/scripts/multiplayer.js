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

mapLines = map.split("\n");
tileSize = mapCanvas.height / mapLines.length;

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
const frameDelay = 17;
const fov = Math.PI / 3.0;
const maxDistance = mapLines.length * 1.5;
const rayCount = 100;
const textureResolution = 100;
const canvasScale = gameCanvas.width / rayCount;

depthMap = new Array(rayCount);
score = 0;
playerId = null;

// Player constants
const walkSpeed = 0.003;
const turnSpeed = 0.0015;

// Map Constants
const playerSize = 10;
const enemySize = 10;

class Texture {
    constructor(source, resolution) {
        this.source = source;
        this.resolution = resolution;

        this.textureCtx = loadTexture(resolution, resolution, source);
        this.textureData = null;
    }

    getPixelRaw(x, y) {
        return this.textureCtx.getImageData(x, y, 1, 1).data;
    }

    getPixel(x, y) {
        if (this.textureData == null) {
            this.loadTextureData();
        }
        return this.textureData[x][y];
    }

    loadTextureData() {
        this.textureData = new Array(this.resolution)
            .fill(null)
            .map(() => new Array(this.resolution).fill(null));
        for (let i = 0; i < this.resolution; i++) {
            for (let j = 0; j < this.resolution; j++) {
                this.textureData[i][j] = this.getPixelRaw(i, j);
            }
        }
    }
}

const alexTexture = new Texture("images/alexTexture.png", textureResolution);

class Sprite {
    constructor(x, y, texture) {
        this.x = x;
        this.y = y;
        this.resolution = textureResolution;
        this.texture = texture;
        this.distance = 0;
    }

    updateDistance() {
        this.distance = Math.sqrt(
            Math.pow(playerX - this.x, 2) + Math.pow(playerY - this.y, 2)
        );

        this.angle = Math.atan2(this.y - playerY, this.x - playerX);

        while (this.angle - playerAngle > Math.PI) this.angle -= 2 * Math.PI;
        while (this.angle - playerAngle < -Math.PI) this.angle += 2 * Math.PI;
    }
}

function projectMapToCanvas() {
    for (let row = 0; row < mapLines.length; row++) {
        for (let col = 0; col < mapLines[row].length; col++) {
            const char = mapLines[row][col];

            switch (char) {
                case " ":
                    mapCtx.fillStyle = "white";
                    break;
                case "0":
                    mapCtx.fillStyle = "rgb(0, 220, 0)";
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
    mapCtx.fillStyle = "rgb(0, 220, 0)"; // Color of the player
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

function drawMapPlayers(players) {
    mapCtx.fillStyle = "yellow";

    for (let [currentPlayerid, currentPlayerPosition] of players) {
        if (currentPlayerPosition != null) {
            mapCtx.fillRect(
                currentPlayerPosition.x * tileSize - playerSize / 2,
                currentPlayerPosition.y * tileSize - playerSize / 2,
                playerSize,
                playerSize
            );
        }
    }
}

function getValueFromMap(map, x, y) {
    const ys = map.split("\n");

    if (y >= 0 && y < ys.length && x >= 0 && x < ys[y].length) {
        return ys[y][x];
    }

    return null;
}

function castRay(x, y, angle) {
    dirX = Math.cos(angle);
    dirY = Math.sin(angle);

    curX = x;
    curY = y;

    tileX = Math.floor(curX);
    tileY = Math.floor(curY);

    dirSignX = dirX > 0 ? 1 : -1;
    dirSignY = dirY > 0 ? 1 : -1;

    tileOffsetX = dirX > 0 ? 1 : 0;
    tileOffsetY = dirY > 0 ? 1 : 0;

    t = 0;

    if (dirX * dirX + dirY * dirY > 0) {
        while (
            tileX > 0 &&
            tileX < mapLines[0].length &&
            tileY > 0 &&
            tileY < mapLines.length
        ) {
            dtX = (tileX + tileOffsetX - curX) / dirX;
            dtY = (tileY + tileOffsetY - curY) / dirY;

            if (dtX < dtY) {
                t = t + dtX;
                tileX = tileX + dirSignX;
            } else {
                t = t + dtY;
                tileY = tileY + dirSignY;
            }

            curX = x + dirX * t;
            curY = y + dirY * t;

            mapValue = getValueFromMap(map, tileX, tileY);
            if (mapValue != " ") {
                return [t, mapValue];
            }
        }
    }

    return null;
}

function drawPlayerPerspective(playerX, playerY, playerAngle, fov) {
    for (rayIdx = 0; rayIdx < rayCount; rayIdx++) {
        angle = playerAngle - fov / 2 + fov * (rayIdx / rayCount);
        result = castRay(playerX, playerY, angle);

        if (rayIdx == 0 || rayIdx == rayCount - 1) {
            mapCtx.fillStyle = "black";
            mapCtx.beginPath();
            mapCtx.moveTo(playerX * tileSize, playerY * tileSize);
            mapCtx.lineTo(
                (playerX + Math.cos(angle) * result[0]) * tileSize,
                (playerY + Math.sin(angle) * result[0]) * tileSize
            );

            mapCtx.stroke();
        }

        if (result != null) {
            distance = result[0];
            hitObject = result[1];

            fisheye_fix = Math.cos(angle - playerAngle);
            wallHeight = gameCanvas.height / (distance * fisheye_fix);

            intensity = 1 - distance / maxDistance;

            switch (hitObject) {
                case "0":
                    gameCtx.fillStyle = `rgb(${0 * intensity}, ${
                        255 * intensity
                    }, ${0 * intensity})`;
                    break;
                case "1":
                    gameCtx.fillStyle = `rgb(${0 * intensity}, ${
                        0 * intensity
                    }, ${255 * intensity})`;
                    break;
                case "2":
                    gameCtx.fillStyle = `rgb(${255 * intensity}, ${
                        0 * intensity
                    }, ${0 * intensity})`;
                    break;
            }

            gameCtx.fillRect(
                rayIdx * canvasScale,
                (gameCanvas.height - wallHeight) / 2,
                canvasScale,
                wallHeight
            );
            depthMap[rayIdx] = distance;
        }
    }
}

function addPlayersToSprites(players, sprites) {
    for (let [currentPlayerid, currentPlayerPosition] of players) {
        if (currentPlayerPosition != null) {
            sprites.push(
                new Sprite(
                    currentPlayerPosition.x,
                    currentPlayerPosition.y,
                    null
                )
            );
        }
    }
}

function drawSprite(sprite) {
    spriteSize = gameCanvas.height / sprite.distance;

    xOffset =
        ((sprite.angle - playerAngle) / fov) * gameCanvas.width +
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
                    if (sprite.texture != null) {
                        texturePixel = sprite.texture.getPixel(i, j);

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
                    } else {
                        gameCtx.fillStyle = "yellow";
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

function drawSprites(sprites) {
    for (spriteIdx = 0; spriteIdx < sprites.length; spriteIdx++) {
        drawSprite(sprites[spriteIdx]);
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

    sprites = [];
    addEnemiesToSprites(enemies, sprites);
    addPlayersToSprites(players, sprites);
    updateSprites(sprites);

    // Fill with gradient
    gameCtx.fillStyle = grd;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    projectMapToCanvas(map);

    drawPlayerPerspective(playerX, playerY, playerAngle, fov);
    drawPlayer(playerX, playerY);

    drawSprites(sprites);

    drawMapEnemies(enemies);
    drawMapPlayers(players);
}

function addEnemiesToSprites(enemies, sprites) {
    for (enemyIdx = 0; enemyIdx < enemies.length; enemyIdx++) {
        sprites.push(enemies[enemyIdx]);
    }
}

function updateSprites(sprites) {
    for (spriteIdx = 0; spriteIdx < sprites.length; spriteIdx++) {
        sprites[spriteIdx].updateDistance();
    }

    sprites.sort(function (x, y) {
        if (x.distance < y.distance) {
            return 1;
        } else if (x.distance > y.distance) {
            return -1;
        } else {
            return 0;
        }
    });
}

const audio = document.createElement("audio");
audio.src = "audio/gunshot.mp3";
shooting = false;

async function shootEnemies(enemies) {
    // const newAudio = audio.cloneNode();
    // newAudio.play();
    shooting = true;

    await sleep(100);
    for (enemyIdx = enemies.length - 1; enemyIdx >= 0; enemyIdx--) {
        enemy = enemies[enemyIdx];

        if (Math.abs(playerAngle - enemy.angle) > fov / 2.0) continue;
        xOffset =
            enemy.distance * Math.abs(Math.sin(playerAngle - enemy.angle));

        if (xOffset < 0.4) {
            result = castRay(playerX, playerY, playerAngle);
            if (enemy.distance > result[0] && result[1] != " ") {
                continue;
            } else {
                enemies.splice(enemyIdx, 1);
                score++;
                break;
            }
        }
    }

    await sleep(500);

    shooting = false;
}

function drawGUI() {
    gameCtx.font = "30px Comic Sans MS";
    gameCtx.fillStyle = "red";
    gameCtx.textAlign = "left";
    gameCtx.fillText("Score: " + score, 20, 50);

    image = document.getElementById("gun");
    gunHeight = 170;
    gameCtx.drawImage(
        image,
        gameCanvas.width / 2 - 175,
        gameCanvas.height - gunHeight,
        250,
        gunHeight
    );
}

function drawWin(gameTime) {
    gameCtx.font = "50px Comic Sans MS";
    gameCtx.fillStyle = "yellow";
    gameCtx.textAlign = "center";
    gameCtx.fillText("You win!", gameCanvas.width / 2, gameCanvas.height / 2);

    gameCtx.font = "20px Comic Sans MS";
    gameCtx.fillStyle = "green";
    gameCtx.fillText(
        "Press R to restart",
        gameCanvas.width / 2,
        gameCanvas.height / 2 + 30
    );

    gameCtx.fillStyle = "orange";
    gameCtx.fillText(
        gameTime + " seconds",
        gameCanvas.width / 2,
        gameCanvas.height / 2 - 45
    );
}

function updatePosition(timeElapsed, socket) {
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

    if (playerId != null) {
        socket.emit("playerPosition", {
            id: playerId,
            x: playerX,
            y: playerY,
            angle: playerAngle,
        });
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

finalFrame = false;

async function gameLoop() {
    finalFrame = false;
    score = 0;

    playerX = 1.7;
    playerY = 1.5;
    playerAngle = 1;

    enemies = [
        new Sprite(5.0, 2.0, alexTexture),
        new Sprite(13.0, 3.0, alexTexture),
        new Sprite(7.0, 7.0, alexTexture),
        new Sprite(8.0, 9.0, alexTexture),
        new Sprite(2.0, 13.0, alexTexture),
    ];

    gameStartTime = performance.now();
    pastTime = performance.now();

    const socket = io("ws://45.33.62.126:3000");

    socket.on("startGame", (id, playerList) => {
        playerId = id;

        for (playerIdx = 0; playerIdx < playerList.length; playerIdx++) {
            players.set(playerList[playerIdx], null);
        }
    });

    socket.on("playerJoined", (id) => {
        players.set(id, null);
    });

    socket.on("playerLeft", (id) => {
        players.delete(id);
    });

    socket.on("playerPosition", (otherPlayerPosition) => {
        players.set(otherPlayerPosition.id, {
            x: otherPlayerPosition.x,
            y: otherPlayerPosition.y,
        });
    });

    while (true) {
        const currentTime = performance.now();
        const timeElapsed = currentTime - pastTime;

        const renderStartTime = performance.now();

        updatePosition(timeElapsed, socket);

        drawScene();
        const renderEndTime = performance.now();
        const renderTime = renderEndTime - renderStartTime;

        drawGUI();

        if (renderTime < frameDelay) {
            await sleep(frameDelay - renderTime);
        } else {
            await sleep(1);
        }

        pastTime = currentTime;

        if (finalFrame) {
            break;
        }

        if (score == 5) {
            // finalFrame = true;
        }
    }
    gameEndTime = performance.now();

    gameTime = (gameEndTime - gameStartTime) / 1000;

    const audio = document.createElement("audio");
    audio.src = "audio/cheer.mp3";
    audio.play();

    drawWin(gameTime);
}

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case " ":
            if (!shooting) {
                shootEnemies(enemies);
            }
            break;
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
        case "r":
            // if (finalFrame) {
            //     gameLoop();
            // }
            break;
    }
});

sprites = [];
enemies = [];
players = new Map();

gameLoop();
