folder = createFolder("controversy");
folder.addChild(createFile("controversy.txt", "I am controversial"));

rainbow = false;

function animateText() {
    if (!rainbow) {
        const inputElement = document.getElementById("myText");
        inputElement.style.animation = "rainbow 5s linear infinite";

        stylesheet = Array.from(document.styleSheets)[
            document.styleSheets.length - 1
        ];

        stylesheet.insertRule("* { animation: rainbow 5s linear infinite }");

        rainbow = true;
    }
}

const files = [
    createFile("about.txt", "I am 17"),
    createImage("me.jpg", "images/me.jpg"),
    createScript("animation.sh", animateText),
    folder,
];

setup();
