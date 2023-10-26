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

function drawPlayer(x, y, map) {
    const playerSize = 10; // Size of the player pixel
    mapCtx.fillStyle = "green"; // Color of the player
    mapCtx.fillRect(
        x * tileSize - playerSize / 2,
        y * tileSize - playerSize / 2,
        playerSize,
        playerSize
    );
}

playerX = 1.7;
playerY = 1.5;
playerAngle = 1;
const fov = Math.PI / 3.0;

function getValueFromMap(map, x, y) {
    const ys = map.split("\n");

    if (y >= 0 && y < ys.length && x >= 0 && x < ys[y].length) {
        return ys[y][x];
    }

    return null;
}

const maxDistance = lines.length * 1.5;

function castRay(playerX, playerY, playerAngle) {
    const rayX = playerX;
    const rayY = playerY;

    mapCtx.fillStyle = "black"; // Color for the ray

    for (let distance = 0; distance < maxDistance; distance += 0.02) {
        const testX = rayX + Math.cos(playerAngle) * distance;
        const testY = rayY + Math.sin(playerAngle) * distance;

        mapValue = getValueFromMap(map, Math.floor(testX), Math.floor(testY));

        if (mapValue != " ") {
            return [distance, mapValue];
            break;
        }

        mapCtx.fillRect(testX * tileSize, testY * tileSize, 1, 1);
    }
    return null;
}

function drawPlayerPerspective(playerX, playerY, playerAngle, fov) {
    const gameWidth = 60;
    const canvasScale = gameCanvas.width / gameWidth;

    for (i = 0; i < gameWidth; i++) {
        angle = playerAngle - fov / 2 + fov * (i / gameWidth);
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
        }
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

    grd.addColorStop(0.5, `rgb(150, 150, 150)`);
    grd.addColorStop(0, "rgb(255, 255, 255)");

    // Fill with gradient
    gameCtx.fillStyle = grd;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    projectMapToCanvas(map);

    drawPlayerPerspective(playerX, playerY, playerAngle, fov);

    drawPlayer(playerX, playerY);
}

movingForward = false;
movingBackward = false;
turningLeft = false;
turningRight = false;

const walkSpeed = 0.003;
const turnSpeed = 0.0015;

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

const renderDelay = 40;

let textureCanvas = document.getElementById("textureCanvas");
let textureContext = textureCanvas.getContext("2d");

function loadTexture(width, height) {
    const image = new Image(width, height);
    image.onload = drawImage;
    image.src = "images/alexTexture.png";
}

function getPixel(x, y) {
    console.log(textureContext.getImageData(x, y, 1, 1).data);
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
        drawScene();
        const renderEndTime = performance.now();
        const renderTime = renderEndTime - renderStartTime;

        if (renderTime < renderDelay) {
            await sleep(renderDelay - renderTime);
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

loadTexture(10, 10);
gameLoop();
