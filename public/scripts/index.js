folder = createFolder("folder");
folder.addChild(
    createFile(
        "folder.txt",
        "Not really sure why I added folder functionality..."
    )
);

const files = [
    createFile(
        "welcome.txt",
        "Welcome to my website. Type help to get started!"
    ),
    createImage("joe.jpeg", "images/joe.jpeg"),
    folder,
];

setup();
