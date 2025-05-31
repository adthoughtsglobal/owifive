export function rangeInit(selector = 'input[type=range]') {
    document.querySelectorAll(selector).forEach(original => {
        const min = +original.min || 0;
        const max = +original.max || 100;
        const step = +original.step || 1;
        const center = min + ((max - min) / 2);
        let val = original.value === '' ? center : +original.value;

        const wrapper = document.createElement('div');
        wrapper.classList.add('range-wrapper');

        const fill = document.createElement('div');
        fill.classList.add('range-fill');
        wrapper.appendChild(fill);

        const thumb = document.createElement('span');
        thumb.classList.add('range-thumb');
        wrapper.appendChild(thumb);

        function update(v) {
            const p = percent(v, min, max);
            fill.style.width = p + '%';
            thumb.style.left = `calc(${p}% - 6px)`;
        }

        update(val);

        wrapper.addEventListener('mousedown', startDrag);
        wrapper.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            e.preventDefault();
            const move = (ev) => {
                const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
                const rect = wrapper.getBoundingClientRect();
                let ratio = (clientX - rect.left) / rect.width;
                ratio = Math.max(0, Math.min(1, ratio));
                let rawVal = min + (max - min) * ratio;

                const snapThreshold = (max - min) * 0.02;
                let newVal = rawVal;

                if (!original.hasAttribute('data-nosnap') && Math.abs(rawVal - center) < snapThreshold) {
                    newVal = center;
                }

                newVal = Math.round((newVal - min) / step) * step + min;
                newVal = Math.max(min, Math.min(max, newVal));

                original.value = newVal;
                update(newVal);
                original.dispatchEvent(new Event('input'));
            };

            const stop = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', stop);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', stop);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
            document.addEventListener('touchmove', move);
            document.addEventListener('touchend', stop);
        }

        const observer = new MutationObserver(() => {
            update(Number.isFinite(+original.value) ? +original.value : center);
        });

        original.addEventListener('input', () => {
            update(Number.isFinite(+original.value) ? +original.value : center);
        });


        observer.observe(original, { attributes: true, attributeFilter: ['value'] });

        original.style.display = 'none';
        original.parentNode.insertBefore(wrapper, original.nextSibling);

        if (original.value === '') {
            original.value = center;
            original.dispatchEvent(new Event('input'));
        }
    });
}

function percent(val, min, max) {
    return ((val - min) / (max - min)) * 100;
}