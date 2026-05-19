(function() {
    const track = document.querySelector('.carousel-track');
    const prev = document.querySelector('.carousel-prev');
    const next = document.querySelector('.carousel-next');
    const dots = document.querySelector('.carousel-dots');
    if (!track) return;
    const cards = track.querySelectorAll('.feature-card');
    let index = 0;

    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dots.appendChild(dot);
    });

    function goTo(i) {
        index = i;
        const card = cards[i];
        const offset = card.offsetLeft - track.offsetLeft;
        track.scrollTo({ left: offset, behavior: 'smooth' });
        dots.querySelectorAll('.carousel-dot').forEach((d, j) => {
            d.classList.toggle('active', j === i);
        });
    }

    function syncIndexFromScroll() {
        const scrollLeft = track.scrollLeft;
        index = Array.from(cards).reduce((closest, card, i) => {
            const current = Math.abs((card.offsetLeft - track.offsetLeft) - scrollLeft);
            const best = Math.abs((cards[closest].offsetLeft - track.offsetLeft) - scrollLeft);
            return current < best ? i : closest;
        }, 0);
        dots.querySelectorAll('.carousel-dot').forEach((d, j) => {
            d.classList.toggle('active', j === index);
        });
    }

    track.addEventListener('scroll', syncIndexFromScroll);

    prev.addEventListener('click', () => {
        syncIndexFromScroll();
        if (index > 0) goTo(index - 1);
        else goTo(cards.length - 1);
    });

    next.addEventListener('click', () => {
        syncIndexFromScroll();
        if (index < cards.length - 1) goTo(index + 1);
        else goTo(0);
    });

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
    track.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            syncIndexFromScroll();
            const target = diff > 0 ? index + 1 : index - 1;
            if (target >= 0 && target < cards.length) goTo(target);
        }
    });
})();
