const previousCommands = [];
currentDirectory = null;
commandIdx = 0;

class FileObject {
    constructor(name, content, children, imagePath) {
        this.name = name;
        this.content = content;
        this.children = children;
        this.imagePath = imagePath;
    }
}

function createFile(name, content) {
    return new FileObject(name, content, null, null);
}

function createFolder(name, children) {
    return new FileObject(name, null, children, null);
}

function createImage(name, imagePath) {
    return new FileObject(name, null, null, imagePath);
}

function getFile(filename, directory) {
    if (directory == null) {
        for (i = 0; i < files.length; i++) {
            if (files[i].name == filename) {
                return files[i];
            }
        }
    } else {
        for (i = 0; i < directory.children.length; i++) {
            if (directory.children[i].name == filename) {
                return directory.children[i];
            }
        }
    }

    return null;
}

const files = [
    createFile(
        "welcome.txt",
        "Welcome to my website. Type help to get started"
    ),
    createImage("joe.jpeg", "images/joe.jpeg"),
    createFolder("folder", [
        createFile("file3.txt", "files3"),
        createFile("file4.txt", "files4"),
    ]),
];

function listFiles(directory) {
    result = "";
    if (directory == null) {
        for (i = 0; i < files.length; i++) {
            result += files[i].name + "\n";
        }
    } else {
        for (i = 0; i < directory.children.length; i++) {
            result += directory.children[i].name + "\n";
        }
    }
    return result;
}

function parsePath(input) {
    inputFiles = input.split("/");
    parentFolder = currentDirectory;

    fileIdx = 0;
    while (fileIdx < inputFiles.length) {
        currentFile = inputFiles[fileIdx];
        file = getFile(currentFile, parentFolder);

        if (file != null) {
            if (fileIdx + 1 == inputFiles.length) {
                return file;
            } else {
                parentFolder = file;
                fileIdx++;
                continue;
            }
        } else {
            return null;
        }
    }
}

function parseInput(input) {
    const words = input.split(" ");
    if (words.length > 0) {
        switch (words[0]) {
            case "ls":
                if (words.length == 1) {
                    return ["ls", listFiles(currentDirectory)];
                } else if (words.length == 2) {
                    directory = parsePath(words[1]);
                    if (directory != null) {
                        return ["ls", istFiles(directory)];
                    } else {
                        return ["ls", "Invalid path"];
                    }
                }
                break;
            case "cat":
                if (words.length == 2) {
                    file = parsePath(words[1]);
                    if (file != null) {
                        if (file.children == null) {
                            return ["cat", file.content];
                        }
                        return ["cat", file.name + " is a directory"];
                    } else {
                        return ["cat", "Invalid path"];
                    }
                }
                break;
            case "clear":
                return ["clear", null];
            case "pages":
                return [
                    "pages",
                    "index - The page you are currently on\ncontroversial - Some controversial stuff",
                ];
            case "view":
                if (words.length == 2) {
                    file = parsePath(words[1]);
                    console.log(file);
                    if (file.imagePath != null) {
                        return ["view", "Success", file.imagePath];
                    } else {
                        return ["view", "File is not an image."];
                    }
                }
            case "ssh":
                if (words.length == 2) {
                    switch (words[1]) {
                        case "controversial":
                            return [
                                "ssh",
                                "Switching pages...",
                                "/controversial.html",
                            ];
                    }
                }
                break;
            case "cd":
                if (words.length == 1) {
                    currentDirectory = null;
                    return ["cd", ""];
                } else if (words.length == 2) {
                    fileObject = parsePath(words[1]);
                    if (fileObject != null) {
                        if (fileObject.children == null) {
                            return [
                                "cd",
                                fileObject.name + " is not a directory",
                            ];
                        }
                        currentDirectory = fileObject;
                        return ["cd", ""];
                    } else {
                        return ["cd", "Invalid path"];
                    }
                }
            case "help":
                return [
                    "help",
                    "ls - lists files in a directory\ncd - changes the current directory\ncat - reads files\nclear - clears the console\npages - lists this website's pages\n ssh - lets you switch between pages\nview - views an image",
                ];
        }
    }
    return ["none", "Invalid command"];
}

document.addEventListener("keypress", function (event) {
    const prefix = document.getElementById("prefix");
    const inputElement = document.getElementById("myText");
    const textDiv = document.getElementById("previousText");
    const inputArea = document.getElementById("inputArea");

    if (event.key === "Enter") {
        const oldCommand = document.createElement("p");
        oldCommand.textContent = prefix.textContent + " " + inputElement.value;
        textDiv.appendChild(oldCommand);

        previousCommands.push(oldCommand.value);
        commandIdx++;

        const parseResult = parseInput(inputElement.value);

        if (parseResult[0] == "clear") {
            textDiv.innerHTML = "";
        } else if (parseResult[0] == "ssh" && parseResult[2] != null) {
            const response = document.createElement("p");
            response.textContent = "Switching pages...";

            inputArea.style.display = "none";
            textDiv.appendChild(response);

            setTimeout(() => {
                document.location.href = parseResult[2];
                setTimeout(() => {
                    inputArea.style.display = "flex";
                }, 1000);
            }, 500);
        } else if (parseResult[0] == "view" && parseResult[1] == "Success") {
            const response = document.createElement("img");
            response.src = parseResult[2];
            response.style.height = "200px";
            textDiv.appendChild(response);
        } else {
            if ((parseResult[0] = "cd")) {
                if (currentDirectory == null) {
                    prefix.textContent = "wyattlake >";
                } else {
                    prefix.textContent =
                        "wyattlake/" + currentDirectory.name + " >";
                }
            }
            const parseSplits = parseResult[1].split("\n");

            for (i = 0; i < parseSplits.length; i++) {
                const response = document.createElement("p");
                response.textContent = parseSplits[i];
                textDiv.appendChild(response);
            }
        }

        inputElement.value = "";
    }
});
