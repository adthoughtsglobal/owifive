
export const state = {
    appliedEffects: [],
    originalImage: null,
    ctx: null,
    canvas: null
};

export function initializeCanvas() {
    var img = document.getElementById('source');
    state.canvas = document.getElementById('canvas');
    state.ctx = state.canvas.getContext('2d');
    state.canvas.width = img.naturalWidth;
    state.canvas.height = img.naturalHeight;
    state.originalImage = img;
    state.appliedEffects = [];
    state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    state.ctx.drawImage(img, 0, 0, state.canvas.width, state.canvas.height);
}

export function applyToCanvas(modifier) {
    var imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
    var data = imageData.data;

    for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];

        var hsl = rgbToHsl(r, g, b);
        hsl = modifier(hsl);
        var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
    }

    state.ctx.putImageData(imageData, 0, 0);
}


export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
            case g: h = ((b - r) / d + 2); break;
            case b: h = ((r - g) / d + 4); break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    var r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
}
export var effectslib = {
    colors: {
        icon: "colors",
        hue: function (degree) {
            applyToCanvas(function (hsl) {
                var h = (hsl[0] * 360 + degree) % 360;
                if (h < 0) h += 360;
                h /= 360;
                return [h, hsl[1], hsl[2]];
            });
        },
        saturation: function (amount) {
            applyToCanvas(function (hsl) {
                return [hsl[0], Math.min(1, Math.max(0, hsl[1] + amount / 100)), hsl[2]];
            });
        },
        contrast: function (amount) {
            var factor = (259 * (amount + 255)) / (255 * (259 - amount));
            var imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                data[i] = factor * (data[i] - 128) + 128;
                data[i + 1] = factor * (data[i + 1] - 128) + 128;
                data[i + 2] = factor * (data[i + 2] - 128) + 128;
            }
            state.ctx.putImageData(imageData, 0, 0);
        },
        brightness: function (amount) {
            var imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                data[i] += amount;
                data[i + 1] += amount;
                data[i + 2] += amount;
            }
            state.ctx.putImageData(imageData, 0, 0);
        }
    },
    filters: {
        icon: "blur_on",
        blur: function () {
            var imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
            var weights = [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9];
            var side = 3;
            var halfSide = Math.floor(side / 2);
            var src = imageData.data;
            var sw = imageData.width;
            var sh = imageData.height;
            var output = state.ctx.createImageData(sw, sh);
            var dst = output.data;

            for (var y = 0; y < sh; y++) {
                for (var x = 0; x < sw; x++) {
                    var r = 0, g = 0, b = 0;
                    for (var cy = 0; cy < side; cy++) {
                        for (var cx = 0; cx < side; cx++) {
                            var scy = y + cy - halfSide;
                            var scx = x + cx - halfSide;
                            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                                var srcOffset = (scy * sw + scx) * 4;
                                var wt = weights[cy * side + cx];
                                r += src[srcOffset] * wt;
                                g += src[srcOffset + 1] * wt;
                                b += src[srcOffset + 2] * wt;
                            }
                        }
                    }
                    var dstOffset = (y * sw + x) * 4;
                    dst[dstOffset] = r;
                    dst[dstOffset + 1] = g;
                    dst[dstOffset + 2] = b;
                    dst[dstOffset + 3] = 255;
                }
            }
            state.ctx.putImageData(output, 0, 0);
        },
        sharpen: function () { /* ... */ }
    }
};

// Add metadata after definition:
effectslib.colors.hue._meta = {
    type: "range",
    min: -180,
    max: 180,
    step: 1,
    default: 0,
    label: "Hue"
};

effectslib.colors.saturation._meta = {
    type: "range",
    min: -100,
    max: 100,
    step: 1,
    default: 0,
    label: "Saturation"
};

effectslib.colors.contrast._meta = {
    type: "range",
    min: -255,
    max: 255,
    step: 1,
    default: 0,
    label: "Contrast"
};

effectslib.colors.brightness._meta = {
    type: "range",
    min: -255,
    max: 255,
    step: 1,
    default: 0,
    label: "Brightness"
};

effectslib.filters.blur._meta = {
    type: "button",
    label: "Blur"
};

effectslib.filters.sharpen._meta = {
    type: "button",
    label: "Sharpen"
};

effectslib.filters.blur = function () {
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var weights = [
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9,
        1/9, 1/9, 1/9
    ];
    var side = 3;
    var halfSide = Math.floor(side / 2);
    var src = imageData.data;
    var sw = imageData.width;
    var sh = imageData.height;
    var output = ctx.createImageData(sw, sh);
    var dst = output.data;

    for (var y = 0; y < sh; y++) {
        for (var x = 0; x < sw; x++) {
            var r = 0, g = 0, b = 0;
            for (var cy = 0; cy < side; cy++) {
                for (var cx = 0; cx < side; cx++) {
                    var scy = y + cy - halfSide;
                    var scx = x + cx - halfSide;
                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                        var srcOffset = (scy * sw + scx) * 4;
                        var wt = weights[cy * side + cx];
                        r += src[srcOffset] * wt;
                        g += src[srcOffset + 1] * wt;
                        b += src[srcOffset + 2] * wt;
                    }
                }
            }
            var dstOffset = (y * sw + x) * 4;
            dst[dstOffset] = r;
            dst[dstOffset + 1] = g;
            dst[dstOffset + 2] = b;
            dst[dstOffset + 3] = 255;
        }
    }
    ctx.putImageData(output, 0, 0);
};