currentDirectory = "wyattlake";
commandList = [];
commandIdx = 0;
currentCommandInput = "";

addedEventListeners = false;

class FileObject {
    constructor(name, content, children, imagePath, script, parent) {
        this.name = name;
        this.content = content;
        this.children = children;
        this.imagePath = imagePath;
        this.script = script;
        this.parent = parent;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
}

function createFile(name, content) {
    return new FileObject(name, content, null, null, null, "wyattlake");
}

function createFolder(name) {
    return new FileObject(name, null, [], null, null, "wyattlake");
}

function createImage(name, imagePath) {
    return new FileObject(name, null, null, imagePath, null, "wyattlake");
}

function createScript(name, script) {
    return new FileObject(name, null, null, null, script, "wyattlake");
}

function getFile(filename, directory) {
    if (directory == "wyattlake") {
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

function listFiles(directory) {
    result = "";
    if (directory == "wyattlake") {
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
        if (currentFile == "..") {
            if (fileIdx + 1 == inputFiles.length) {
                return parentFolder.parent;
            } else {
                parentFolder = parentFolder.parent;
                fileIdx++;
                continue;
            }
        } else if (currentFile == ".") {
            if (fileIdx + 1 == inputFiles.length) {
                return parentFolder == null ? "wyattlake" : parentFolder;
            } else {
                fileIdx++;
                continue;
            }
        }

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
    if (input == "") {
        return ["none", ""];
    }

    const words = input.split(" ");
    if (words.length > 0) {
        switch (words[0]) {
            case "ls":
                if (words.length == 1) {
                    return ["ls", listFiles(currentDirectory)];
                } else if (words.length == 2) {
                    directory = parsePath(words[1]);
                    if (directory != null) {
                        return ["ls", listFiles(directory)];
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
                            if (file.imagePath != null) {
                                return [
                                    "cat",
                                    "Use the view command to view images",
                                ];
                            } else if (file.script != null) {
                                return [
                                    "cat",
                                    "Use the bash command to run scripts",
                                ];
                            }
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
                    "index - The main page of this website\nabout - About me",
                ];
            case "view":
                if (words.length == 2) {
                    file = parsePath(words[1]);
                    if (file != null) {
                        if (file.imagePath != null) {
                            return ["view", "Success", file.imagePath];
                        } else {
                            return ["view", "File is not an image"];
                        }
                    } else {
                        return ["view", "Invalid path"];
                    }
                }
                break;
            case "ssh":
                if (words.length == 2) {
                    switch (words[1]) {
                        case "about":
                            return ["ssh", "Success", "/about.html"];
                        case "index":
                            return ["ssh", "Success", "/"];
                        default:
                            return [
                                "ssh",
                                "Not a valid page. Run the pages command to see the page list",
                            ];
                    }
                }
                break;
            case "cd":
                if (words.length == 1) {
                    currentDirectory = "wyattlake";
                    return ["cd", ""];
                } else if (words.length == 2) {
                    fileObject = parsePath(words[1]);
                    if (fileObject == "wyattlake") {
                        currentDirectory = "wyattlake";
                        return ["cd", ""];
                    } else if (fileObject != null) {
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
                break;
            case "bash":
                if (words.length == 2) {
                    file = parsePath(words[1]);
                    if (file != null) {
                        if (file.script != null) {
                            return [
                                "bash",
                                "Executed " + file.name,
                                file.script,
                            ];
                        } else {
                            return ["bash", "File is not an script"];
                        }
                    } else {
                        return ["bash", "Invalid path"];
                    }
                }
                break;
            case "swap":
                return ["swap", "Swapping page..."];
            case "help":
                return [
                    "help",
                    "ls - lists files in a directory\ncd - changes the current directory\ncat - reads files\nclear - clears the console\npages - lists this website's pages\n ssh - lets you switch between pages\nview - views an image\nbash - runs a .sh file\nswap - swaps pages (had to actually complete the assignment)",
                ];
        }
    }
    return ["none", "Invalid command"];
}

ctrlDown = false;

function setup() {
    document.addEventListener("keydown", function (event) {
        if (event.key === "Control") {
            ctrlDown = true;
        } else if (event.key === "ArrowUp") {
            const inputElement = document.getElementById("myText");
            if (commandIdx == commandList.length) {
                currentCommandInput = inputElement.value;
            }
            if (commandList.length == 0) {
                inputElement.value = "";
                commandIdx = -1;
            } else {
                if (commandIdx > 0) {
                    commandIdx--;
                }

                inputElement.value = commandList[commandIdx];

                inputElement.focus();
                window.setTimeout(function () {
                    inputElement.setSelectionRange(
                        inputElement.value.length,
                        inputElement.value.length
                    );
                }, 0);
            }
        } else if (event.key === "ArrowDown") {
            const inputElement = document.getElementById("myText");

            if (commandIdx < commandList.length) {
                commandIdx++;
            }

            if (commandIdx == commandList.length) {
                inputElement.value = currentCommandInput;
            } else {
                inputElement.value = commandList[commandIdx];
            }

            inputElement.focus();
        }
    });
    document.addEventListener("keyup", function (event) {
        if (event.key === "Control") {
            ctrlDown = false;
        }
    });
    document.addEventListener("keypress", function (event) {
        addedEventListeners = true;

        const prefix = document.getElementById("prefix");
        const inputElement = document.getElementById("myText");
        const textDiv = document.getElementById("previousText");
        const inputArea = document.getElementById("inputArea");

        inputElement.focus();

        if (event.key === "Enter") {
            const oldCommand = document.createElement("p");
            oldCommand.textContent =
                prefix.textContent + " " + inputElement.value;
            textDiv.appendChild(oldCommand);

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
            } else if (parseResult[0] == "swap") {
                const response = document.createElement("p");
                response.textContent = "Switching pages...";

                inputArea.style.display = "none";
                textDiv.appendChild(response);

                setTimeout(() => {
                    pageToAdd = currentPage == "index" ? "about" : "index";

                    textDiv.innerHTML = "";

                    headChildren = document.head.children;

                    for (i = 0; i < headChildren.length; i++) {
                        if (
                            headChildren[i].getAttribute("src") ==
                                "scripts/" + currentPage + ".js" ||
                            headChildren[i].getAttribute("href") ==
                                "styles/" + currentPage + ".css"
                        ) {
                            document.head.removeChild(headChildren[i]);
                        }
                    }

                    newScript = document.createElement("script");
                    newScript.setAttribute(
                        "src",
                        "scripts/" + pageToAdd + ".js"
                    );

                    document.head.appendChild(newScript);

                    var newLink = document.createElement("link");

                    newLink.type = "text/css";
                    newLink.rel = "stylesheet";
                    newLink.href = "styles/" + pageToAdd + ".css";

                    document.head.appendChild(newLink);

                    inputArea.style.display = "flex";

                    commandList = [];
                    commandIdx = 0;
                    currentCommandInput = "";

                    currentPage = pageToAdd;
                }, 500);
            } else if (
                parseResult[0] == "view" &&
                parseResult[1] == "Success"
            ) {
                const response = document.createElement("img");
                response.src = parseResult[2];
                response.style.height = "200px";
                textDiv.appendChild(response);
            } else {
                if (parseResult[0] == "cd") {
                    if (currentDirectory == "wyattlake") {
                        prefix.textContent = "wyattlake >";
                    } else {
                        prefix.textContent =
                            "wyattlake/" + currentDirectory.name + " >";
                    }
                }

                const parseSplits = parseResult[1].split("\n");

                for (i = 0; i < parseSplits.length; i++) {
                    if (i + 1 == parseSplits.length && parseSplits[i] == "") {
                        break;
                    }
                    const response = document.createElement("p");
                    response.textContent = parseSplits[i];
                    textDiv.appendChild(response);
                }

                if (parseResult[0] == "bash" && parseResult[2] != null) {
                    parseResult[2]();
                }
            }

            commandList.push(inputElement.value);
            commandIdx = commandList.length;
            inputElement.value = "";
            window.scrollTo(0, document.body.scrollHeight);
        } else if (event.key === "l") {
            if (ctrlDown) {
                textDiv.innerHTML = "";
            }
        } else if (event.key === "c") {
            if (ctrlDown) {
                const oldCommand = document.createElement("p");
                oldCommand.textContent =
                    prefix.textContent + " " + inputElement.value;
                textDiv.appendChild(oldCommand);

                commandList.push(inputElement.value);
                commandIdx = commandList.length;

                inputElement.value = "";
            }
        }
    });

    document.addEventListener("click", function () {
        const inputElement = document.getElementById("myText");

        inputElement.focus();
    });
}
