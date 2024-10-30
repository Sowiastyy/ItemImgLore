document.getElementById('imageInput').addEventListener('change', function(event) {
    loadImage();
});

document.getElementById('maxWidthInput').addEventListener('input', function() {
    loadImage();
});

document.getElementById('maxHeightInput').addEventListener('input', function() {
    loadImage();
});

document.getElementById('italicOption').addEventListener('change', function() {
    generateCommand();
});

document.getElementById('onlyLoreTag').addEventListener('change', function() {
    generateCommand();
});

function loadImage() {
    const canvas = document.getElementById('itemCanvas');
    const ctx = canvas.getContext('2d');
    const file = document.getElementById('imageInput').files[0];

    if (!file) {
        return;
    }

    const img = new Image();
    img.onload = function() {
        // Pobierz wartości maksymalnych rozmiarów z pól input
        const maxWidth = parseInt(document.getElementById('maxWidthInput').value) || 50;
        const maxHeight = parseInt(document.getElementById('maxHeightInput').value) || 50;

        let width = img.width;
        let height = img.height;

        // Skaluj obraz do maksymalnych rozmiarów
        if (width > maxWidth) {
            height = Math.floor(height * (maxWidth / width));
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.floor(width * (maxHeight / height));
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Automatycznie generuj komendę po wczytaniu obrazu
        generateCommand();
    };
    img.src = URL.createObjectURL(file);
}

document.getElementById('generateCommand').addEventListener('click', function() {
    generateCommand();
});

function generateCommand() {
    const canvas = document.getElementById('itemCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (width === 0 || height === 0) {
        alert('Proszę wybrać obraz przed wygenerowaniem komendy.');
        return;
    }

    const pixelData = ctx.getImageData(0, 0, width, height).data;
    const onlyLoreTag = document.getElementById('onlyLoreTag').checked;
    const italicOption = document.getElementById('italicOption').checked;

    let command = '';
    if (!onlyLoreTag) {
        command = '/give @p minecraft:stone{display:{Name:\'{"text":"Custom Item"}\',Lore:';
    }
    command += '[';
    let previewHTML = '';

    for (let y = 0; y < height; y++) {
        command += '\'{"extra":[';
        let previousColor = null;
        let count = 0;
        let lineOutput = '';
        let previewLine = '<div class="line">';

        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const pixel = [
                pixelData[index],
                pixelData[index + 1],
                pixelData[index + 2],
                pixelData[index + 3]
            ];

            let color = getColor(pixel);

            // Dla komendy łączymy piksele o tym samym kolorze i ustawieniach
            if (color === previousColor) {
                count++;
            } else {
                if (previousColor !== null) {
                    lineOutput += generateTextSegment(previousColor, count, italicOption);
                }
                previousColor = color;
                count = 1;
            }

            // Dla podglądu zawsze dodajemy każdy piksel osobno
            previewLine += generatePreviewSegment(color, italicOption);
        }
        if (count > 0) {
            lineOutput += generateTextSegment(previousColor, count, italicOption);
        }
        // Remove last comma if exists
        if (lineOutput.endsWith(',')) {
            lineOutput = lineOutput.slice(0, -1);
        }
        command += lineOutput;
        command += '],"text":""}\',';

        previewLine += '</div>';
        previewHTML += previewLine;
    }
    command = command.slice(0, -1); // Remove last comma
    command += ']';
    if (!onlyLoreTag) {
        command += '}}';
    }

    document.getElementById('commandOutput').value = command;
    document.getElementById('lorePreview').innerHTML = previewHTML;

    // Wyświetl długość komendy
    const commandLength = command.length;
    document.getElementById('commandLength').innerText = `Długość komendy: ${commandLength} znaków`;

    // Aktualizuj pasek postępu i status
    updateProgressBar(commandLength);
}

document.getElementById('copyCommand').addEventListener('click', function() {
    const commandOutput = document.getElementById('commandOutput');
    commandOutput.select();
    commandOutput.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand('copy');
    alert('Komenda została skopiowana do schowka!');
});

function getColor(pixel) {
    if (pixel[3] === 0) { // Transparent pixel
        return 'black'; // Ustaw kolor na czarny dla przezroczystych pikseli
    }
    const hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
    return hexColor;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function generateTextSegment(color, count, italicOption) {
    // Generujemy segment tekstu dla komendy z opcją "italic"
    const textSegment = {
        "text": "█".repeat(count),
        "color": color
    };
    if (!italicOption) {
        textSegment["italic"] = false;
    }
    return JSON.stringify(textSegment) + ',';
}

function generatePreviewSegment(color, italicOption) {
    // Generujemy pojedynczy piksel dla podglądu z uwzględnieniem kursywy
    const style = `background-color:${color};`;
    const className = italicOption ? 'pixel italic' : 'pixel';
    return `<div class="${className}" style="${style}"></div>`;
}

function updateProgressBar(commandLength) {
    const maxLength = 49331; // Maksymalna długość akceptowana przez Hypixel.pl
    const progressBar = document.getElementById('progressBar');
    const progressIndicator = document.getElementById('progressIndicator');
    const statusMessage = document.getElementById('statusMessage');

    // Oblicz procent zajętości paska
    let percentage = (commandLength / maxLength) * 100;
    if (percentage > 100) percentage = 100;

    // Ustaw pozycję wskaźnika
    progressIndicator.style.left = `${percentage}%`;

    // Zmiana koloru wskaźnika w zależności od pozycji
    if (commandLength <= maxLength) {
        progressIndicator.style.backgroundColor = 'green';
        // Aktualizuj status
        statusMessage.innerText = 'Komenda jest akceptowalna.';
        statusMessage.style.color = 'green';
    } else {
        progressIndicator.style.backgroundColor = 'red';
        // Aktualizuj status
        statusMessage.innerText = 'Komenda jest za długa i może skasować ci przedmiot';
        statusMessage.style.color = 'red';
    }
}
