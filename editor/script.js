import { rangeInit } from './scripts/range.js';
import * as eff from './scripts/effects.js';

const sourceImage = document.getElementById('source');
sourceImage.onload = () => {
    rangeInit();
    eff.initializeCanvas();

const effectsGrid = document.querySelector('.effects_grid');

Object.keys(eff.effectslib).forEach(key => {
    let singularEffectBtn = document.createElement('div');
    singularEffectBtn.className = 'singular_effect_btn';

    let iconDiv = document.createElement('div');
    iconDiv.className = 'icon msr';
    iconDiv.textContent = eff.effectslib[key].icon;

    let labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = key.charAt(0).toUpperCase() + key.slice(1);

    singularEffectBtn.appendChild(iconDiv);
    singularEffectBtn.appendChild(labelDiv);
    singularEffectBtn.addEventListener("click", () => {
        renderEffectTools(key, singularEffectBtn);
    })
    effectsGrid.appendChild(singularEffectBtn);
});
};

if (sourceImage.complete) {
    sourceImage.onload();
}
function renderEffectTools(key, ele) {
    Array.from(document.getElementsByClassName("singular_effect_btn")).forEach((x) => {
        x.classList.remove("active");
    });

    ele.classList.add("active");

    var container = document.getElementById("effect_tools");
    container.innerHTML = "";

    var category = eff.effectslib[key];
    if (!category) return;

    Object.keys(category).forEach(function (subKey) {
        var effectFunc = category[subKey];
        if (typeof effectFunc !== "function") return;

        var meta = effectFunc._meta || {};

        var label = document.createElement("div");
        label.className = "label";
        label.textContent = meta.label || subKey;
        container.appendChild(label);

        if (meta.type === "range") {
            var input = document.createElement("input");
            input.type = "range";
            input.min = meta.min ?? 0;
            input.max = meta.max ?? 100;
            input.step = meta.step ?? 1;
            input.value = meta.default ?? 0;

            if (meta.nosnap) {
                input.setAttribute("data-nosnap", "");
            }

            input.addEventListener("input", function () {
                var value = parseFloat(this.value);

                var existing = eff.state.appliedEffects.find(e => e.categoryKey === key && e.effectKey === subKey);
                if (existing) {
                    existing.value = value;
                } else {
                    eff.state.appliedEffects.push({ categoryKey: key, effectKey: subKey, value: value });
                }

                renderImage();
            });

            container.appendChild(input);

        } else if (meta.type === "button") {
            var btn = document.createElement("button");
            btn.textContent = meta.label || subKey;

            btn.addEventListener("click", function () {
                eff.state.appliedEffects.push({ categoryKey: key, effectKey: subKey });
                renderImage();
            });

            container.appendChild(btn);
        }
    });

    rangeInit();
}
let lastRenderTime = 0;

function renderImage() {
    const now = Date.now();
    if (now - lastRenderTime < 300) return;
    lastRenderTime = now;

    if (!eff.state.originalImage) return;
    eff.state.ctx.clearRect(0, 0, eff.state.canvas.width, eff.state.canvas.height);
    eff.state.ctx.drawImage(eff.state.originalImage, 0, 0, eff.state.canvas.width, eff.state.canvas.height);
    console.log(eff.state.appliedEffects);

    eff.state.appliedEffects.forEach(({ categoryKey, effectKey, value }) => {
        var effectGroup = eff.effectslib[categoryKey];
        if (!effectGroup) return;

        var effectFunc = effectGroup[effectKey];
        if (typeof effectFunc !== "function") return;

        if (value !== undefined) {
            effectFunc(value);
        } else {
            effectFunc();
        }
    });
    renderEffectsList()
}

function renderEffectsList() {
    const list = document.getElementById('effectlist');
    list.innerHTML = '';
    eff.state.appliedEffects.forEach((effect, index) => {
        const item = document.createElement('div');
        item.className = 'effectinlist';
        item.setAttribute('data-index', index);

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = effect.effectKey;

        const handle = document.createElement('div');
        handle.className = 'handle msr';
        handle.textContent = 'drag_indicator';

        item.appendChild(label);
        item.appendChild(handle);
        list.appendChild(item);
    });
}

Sortable.create(document.getElementById('effectlist'), {
    handle: '.handle',
    animation: 150,
    onEnd: function (evt) {
        const newOrder = Array.from(document.querySelectorAll('.effectinlist'))
            .map(el => parseInt(el.getAttribute('data-index')));

        const reordered = newOrder.map(i => eff.state.appliedEffects[i]);
        eff.state.appliedEffects = reordered;

        renderEffectsList();
        renderImage();
    }
});
