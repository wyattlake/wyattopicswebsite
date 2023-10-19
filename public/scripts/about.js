currentPage = "about";

folder = createFolder("controversy");
folder.addChild(createFile("controversy.txt", "I am controversial"));

function animateText() {
    const inputElement = document.getElementById("myText");
    inputElement.style.animation = "rainbow 5s linear infinite";

    stylesheets = Array.from(document.styleSheets);

    for (i = 0; i < stylesheets.length; i++) {
        if (
            stylesheets[i].href.toString().indexOf("about.css") != -1 ||
            stylesheets[i].href.toString().indexOf("index.css") != -1
        ) {
            stylesheets[i].insertRule(
                "p, label { animation: rainbow 5s linear infinite }"
            );
        }
    }
}

files = [
    createFile("about.txt", "I am 17"),
    createImage("me.jpg", "images/me.jpg"),
    createScript("animation.sh", animateText),
    folder,
];

if (!addedEventListeners) {
    setup();
}
