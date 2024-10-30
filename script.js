document.getElementById('imageInput').addEventListener('change', function(event) {
    const canvas = document.getElementById('itemCanvas');
    const ctx = canvas.getContext('2d');
    const file = event.target.files[0];
    const img = new Image();
    img.onload = function() {
        // Resize image if too big
        const maxWidth = 50;
        const maxHeight = 50;
        let width = img.width;
        let height = img.height;

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
    };
    img.src = URL.createObjectURL(file);
});

document.getElementById('generateCommand').addEventListener('click', function() {
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

            // Dla komendy łączymy piksele o tym samym kolorze
            if (color === previousColor) {
                count++;
            } else {
                if (previousColor !== null) {
                    lineOutput += generateTextSegment(previousColor, count);
                }
                previousColor = color;
                count = 1;
            }

            // Dla podglądu zawsze dodajemy każdy piksel osobno
            previewLine += generatePreviewSegment(color);
        }
        if (count > 0) {
            lineOutput += generateTextSegment(previousColor, count);
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
});

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

function generateTextSegment(color, count) {
    // Generujemy segment tekstu dla komendy
    return `{"text":"${"█".repeat(count)}","color":"${color}"},`;
}

function generatePreviewSegment(color) {
    // Generujemy pojedynczy piksel dla podglądu
    return `<div class="pixel" style="background-color:${color};"></div>`;
}
