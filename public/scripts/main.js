const previousCommands = [];
commandIdx = 0;

class FileObject {
    constructor(name, content, children) {
        this.name = name;
        this.content = content;
        this.children = children;
    }
}

function createFile(name, content) {
    return new FileObject(name, content, null);
}

function createFolder(name, children) {
    return new FileObject(name, "", children);
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
    createFile("file2.txt", "files2"),
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
    parentFolder = null;

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
                    return listFiles(null);
                } else if (words.length == 2) {
                    directory = getFile(words[1]);
                    if (directory != null) {
                        return listFiles(directory);
                    } else {
                        return "Invalid path";
                    }
                }
                break;
            case "cat":
                if (words.length == 2) {
                    file = parsePath(words[1]);
                    if (file != null) {
                        if (file.children == null) {
                            return file.content;
                        }
                        return file.name + " is a directory";
                    } else {
                        return "Invalid path";
                    }
                }
                break;
            case "clear":
                return null;
            case "pages":
                return "/ - The page you are currently on\ncontroversial - Some controversial stuff";
            case "ssh":
                console.log("hi");
                if (words.length == 2) {
                    switch (words[1]) {
                        case "controversial":
                            document.location.href = "/controversial.html";
                            return "Switching pages...";
                    }
                }
                break;
            case "help":
                return "ls - lists files in a directory\ncat - reads files\nclear - clears the console\npages - lists this website's pages\n ssh - lets you switch between pages";
        }
    }
    return "Invalid command";
}

document.addEventListener("keypress", function (event) {
    const inputElement = document.getElementById("myText");
    const textDiv = document.getElementById("previousText");

    if (event.key === "Enter") {
        const oldCommand = document.createElement("p");
        oldCommand.textContent = "wyattlake > " + inputElement.value;
        textDiv.appendChild(oldCommand);

        previousCommands.push(oldCommand.value);
        commandIdx++;

        const parseResult = parseInput(inputElement.value);

        if (parseResult == null) {
            textDiv.innerHTML = "";
        } else {
            const parseSplits = parseResult.split("\n");
            for (i = 0; i < parseSplits.length; i++) {
                const response = document.createElement("p");
                response.textContent = parseSplits[i];
                textDiv.appendChild(response);
            }
        }

        inputElement.value = "";
    }
});
