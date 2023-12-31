// const mapCanvas = document.getElementById("mapCanvas");
// const mapCtx = mapCanvas.getContext("2d");

const gameCanvas = document.getElementById("gameCanvas");
const gameCtx = gameCanvas.getContext("2d");

map =
    "000606060001261\n" +
    "0          1  1\n" +
    "0          4  1\n" +
    "0          1  1\n" +
    "0          5  1\n" +
    "222222     1  1\n" +
    "1          4  2\n" +
    "4          1  2\n" +
    "5          1  1\n" +
    "1             1\n" +
    "1113311       3\n" +
    "1             1\n" +
    "3             4\n" +
    "1             1\n" +
    "101310151013101";

const mapLines = map.split("\n");
// tileSize = mapCanvas.height / mapLines.length;

// Player controller variables
movingForward = false;
movingBackward = false;
turningLeft = false;
turningRight = false;

// Rendering constants
const fov = Math.PI / 3.0;
const maxDistance = mapLines.length * 1.5;
const rayCount = 250;
const textureResolution = 40;
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

        this.loadTexture(this.resolution, this.resolution, this.source);
    }

    loadTexture(width, height, src) {
        var textureCanvas = document.createElement("canvas");
        let textureContext = textureCanvas.getContext("2d");

        const image = new Image(width, height);

        image.onload = () => {
            textureCanvas.width = image.width;
            textureCanvas.height = image.height;
            textureContext.drawImage(image, 0, 0, image.width, image.height);

            this.textureData = new Array(this.resolution)
                .fill(null)
                .map(() => new Array(this.resolution).fill(null));
            for (let i = 0; i < this.resolution; i++) {
                for (let j = 0; j < this.resolution; j++) {
                    this.textureData[i][j] = textureContext.getImageData(
                        i,
                        j,
                        1,
                        1
                    ).data;
                }
            }
        };

        image.src = src;
    }

    getPixel(x, y) {
        return this.textureData[x][y];
    }
}

class WallTexture {
    constructor(source, resolution) {
        this.source = source;
        this.resolution = resolution;

        this.loadTexture(this.resolution, this.resolution, this.source);
    }

    loadTexture(width, height, src) {
        var textureCanvas = document.createElement("canvas");
        let textureContext = textureCanvas.getContext("2d");

        const image = new Image(width, height);

        image.onload = () => {
            textureCanvas.width = image.width;
            textureCanvas.height = image.height;
            textureContext.drawImage(image, 0, 0, image.width, image.height);

            this.textureData = new Array(width).fill(null);

            for (let i = 0; i < this.resolution; i++) {
                this.textureData[i] = textureContext.getImageData(
                    i,
                    0,
                    1,
                    height
                ).data;
            }
        };

        image.src = src;
    }

    getPixel(x, y) {
        return this.textureData[x][y];
    }
}

alexTexture = new Texture("images/alexTexture.png", textureResolution);
wallTextures = [
    new WallTexture("images/MARBLE1.png", textureResolution),
    new WallTexture("images/MARBLE2.png", textureResolution),
    new WallTexture("images/MARBLE3.png", textureResolution),
    new WallTexture("images/MARBLOD1.png", textureResolution),
    new WallTexture("images/MARBFACE.png", textureResolution),
    new WallTexture("images/MARBFAC2.png", textureResolution),
    new WallTexture("images/MARBFAC3.png", textureResolution),
];

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
function getValueFromMap(x, y) {
    if (y >= 0 && y < mapLines.length && x >= 0 && x < mapLines[y].length) {
        return mapLines[y][x];
    }

    return null;
}
function castRay(x, y, angle) {
    dirX = Math.cos(angle);
    dirY = Math.sin(angle);

    tileX = Math.floor(x);
    tileY = Math.floor(y);

    dirSignX = dirX > 0 ? 1 : -1;
    dirSignY = dirY > 0 ? 1 : -1;

    tileOffsetX = dirX > 0 ? 1 : 0;
    tileOffsetY = dirY > 0 ? 1 : 0;

    t = 0;

    dtX = (tileX + tileOffsetX - x) / dirX;
    dtY = (tileY + tileOffsetY - y) / dirY;

    if (dirX * dirX + dirY * dirY > 0) {
        while (
            tileX > 0 &&
            tileX < mapLines[0].length &&
            tileY > 0 &&
            tileY < mapLines.length
        ) {
            dt = 0;
            dTileX = 0;
            dTileY = 0;

            if (dtX < dtY) {
                tileX = tileX + dirSignX;
                dt = dtX;
                t = t + dt;
                dtX = dtX + dirSignX / dirX - dt;
                dtY = dtY - dt;
            } else {
                tileY = tileY + dirSignY;
                dt = dtY;
                t = t + dt;
                dtX = dtX - dt;
                dtY = dtY + dirSignY / dirY - dt;
            }

            mapValue = getValueFromMap(tileX, tileY);
            if (mapValue != " ") {
                return [t, mapValue, x + dirX * t, y + dirY * t];
            }
        }
    }

    return null;
}

function drawPlayerPerspective(playerX, playerY, playerAngle, fov) {
    for (rayIdx = 0; rayIdx < rayCount; rayIdx++) {
        angle = playerAngle - fov / 2 + fov * (rayIdx / rayCount);
        result = castRay(playerX, playerY, angle);

        // if (rayIdx == 0 || rayIdx == rayCount - 1) {
        //     mapCtx.fillStyle = "black";
        //     mapCtx.beginPath();
        //     mapCtx.moveTo(playerX * tileSize, playerY * tileSize);
        //     mapCtx.lineTo(
        //         (playerX + Math.cos(angle) * result[0]) * tileSize,
        //         (playerY + Math.sin(angle) * result[0]) * tileSize
        //     );

        //     mapCtx.stroke();
        // }

        if (result != null) {
            distance = result[0];
            hitObject = result[1];

            fisheye_fix = Math.cos(angle - playerAngle);
            wallHeight = gameCanvas.height / (distance * fisheye_fix);

            intensity = 1 - distance / maxDistance;

            textureIdx = hitObject - "0";

            wallTexture = wallTextures[textureIdx];

            cx = result[2];
            cy = result[3];

            hitX = cx - Math.floor(cx + 0.5);
            hitY = cy - Math.floor(cy + 0.5);

            let xTexcoord;
            if (Math.abs(hitY) > Math.abs(hitX)) {
                xTexcoord = hitY * wallTexture.resolution;
            } else {
                xTexcoord = hitX * wallTexture.resolution;
            }

            if (xTexcoord < 0) xTexcoord += wallTexture.resolution;

            yScale = wallHeight / wallTexture.resolution;

            if (wallTexture.textureData != null) {
                textureColumn = wallTexture.textureData[Math.floor(xTexcoord)];

                pixX = rayIdx * canvasScale;
                for (i = 0; i < wallTexture.resolution; i++) {
                    pixY = i * yScale + gameCanvas.height / 2 - wallHeight / 2;
                    if (pixY + yScale < 0 || pixY >= gameCanvas.height)
                        continue;
                    gameCtx.fillStyle = `rgb(${
                        textureColumn[i * 4] * intensity
                    }, ${textureColumn[i * 4 + 1] * intensity}, ${
                        textureColumn[i * 4 + 2] * intensity
                    })`;
                    gameCtx.fillRect(pixX, pixY, canvasScale + 1, yScale + 1);
                }
            }

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
                    pixelYOffset + pixelScale > 0 &&
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
    // clearCanvas(gameCanvas, gameCtx);
    // clearCanvas(mapCanvas, mapCtx);

    gameCtx.fillStyle = "black";
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    const grd = gameCtx.createLinearGradient(0, 0, 0, gameCanvas.height);
    grd.addColorStop(1, "rgb(110, 115, 100)");

    grd.addColorStop(0.5, `rgb(10, 15, 0)`);
    grd.addColorStop(0, "rgb(110, 115, 100)");

    sprites = [];
    addEnemiesToSprites(enemies, sprites);
    addPlayersToSprites(players, sprites);
    updateSprites(sprites);

    // Fill with gradient
    gameCtx.fillStyle = grd;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // projectMapToCanvas(map);

    image = document.getElementById("sky");
    gunHeight = 170;
    // gameCtx.drawImage(
    //     image,
    //     0,
    //     0,
    //     gameCanvas.width,
    //     gameCanvas.width * (128 / 256)
    // );

    drawPlayerPerspective(playerX, playerY, playerAngle, fov);
    // drawPlayer(playerX, playerY);

    drawSprites(sprites);

    // drawMapEnemies(enemies);
    // drawMapPlayers(players);
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

timeSinceFpsUpdate = 0;
fps = 60;
function drawGUI(timeElapsed) {
    gameCtx.font = "30px Comic Sans MS";
    gameCtx.fillStyle = "red";
    gameCtx.textAlign = "left";
    gameCtx.fillText("Score: " + score, 20, 50);

    timeSinceFpsUpdate += timeElapsed;
    if (timeSinceFpsUpdate > 1000) {
        timeSinceFpsUpdate = 0;
        fps = Math.round(1000 / timeElapsed);
    }

    gameCtx.font = "15px Comic Sans MS";
    gameCtx.fillStyle = "yellow";
    gameCtx.textAlign = "left";
    gameCtx.fillText("FPS: " + fps, 20, 80);

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
        gameTime / 1000 + " seconds",
        gameCanvas.width / 2,
        gameCanvas.height / 2 - 45
    );
}

function updatePosition(timeElapsed) {
    const walkSpeedFactor = walkSpeed * timeElapsed;
    const turnSpeedFactor = turnSpeed * timeElapsed;

    if (movingForward) {
        newPlayerX = playerX + walkSpeedFactor * Math.cos(playerAngle);
        newPlayerY = playerY + walkSpeedFactor * Math.sin(playerAngle);

        if (
            getValueFromMap(Math.floor(newPlayerX), Math.floor(newPlayerY)) ==
            " "
        ) {
            playerX = newPlayerX;
            playerY = newPlayerY;
        }
    }
    if (movingBackward) {
        newPlayerX = playerX - walkSpeedFactor * Math.cos(playerAngle);
        newPlayerY = playerY - walkSpeedFactor * Math.sin(playerAngle);

        if (
            getValueFromMap(Math.floor(newPlayerX), Math.floor(newPlayerY)) ==
            " "
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

finalFrame = false;

async function setupGame() {
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
}

window.requestAnimationFrame(drawFrame);

let start, previousTimeStamp;

function drawFrame(timeStamp) {
    if (start === undefined) {
        start = timeStamp;
        previousTimeStamp = timeStamp;
    }

    const timeElapsed = timeStamp - previousTimeStamp;

    updatePosition(timeElapsed);

    drawScene();

    drawGUI(timeElapsed);

    previousTimeStamp = timeStamp;

    if (score == 5) {
        finalFrame = true;
    }

    if (finalFrame) {
        drawWin(timeStamp - start);
    } else {
        window.requestAnimationFrame(drawFrame);
    }
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
            if (finalFrame) {
                setupGame();
                window.requestAnimationFrame(drawFrame);
            }
            break;
    }
});

sprites = [];
enemies = [];
players = new Map();

setupGame();
