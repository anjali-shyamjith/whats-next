document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('pw-grid');
    const searchEl = document.getElementById('pw-search');
    const countEl = document.getElementById('pw-count');
    const submitBtn = document.getElementById('pw-submit');

    const MAX_SELECT = 5;
    const selected = new Set(); // stores movie ids (or index as fallback)

    let imageBase = 'https://image.tmdb.org/t/p/w500';
    let allMovies = [];   // the full top-25 list
    let currentList = []; // filtered subset shown in grid

    /* ── No Fallback data used, strictly using API ── */

    /* ── Fetch TMDB image base URL ── */
    try {
        const r = await fetch('/api/config');
        const data = await r.json();
        if (data.success && data.data.images) {
            imageBase = data.data.images.secure_base_url + 'w500';
        }
    } catch (_) { }

    /* ── Fetch top movies (uses discover sorted by vote average) ── */
    const loadTopMovies = async () => {
        try {
            const res = await fetch('/api/suggestions?type=movie&limit=25');
            const data = await res.json();

            if (data.success && data.data.results && data.data.results.length > 0) {
                allMovies = data.data.results.slice(0, 25).map((item, idx) => ({
                    _id: String(item.id || `r${idx}`),
                    title: item.title || item.name || 'Untitled',
                    _poster: item.poster_path
                        ? imageBase + item.poster_path
                        : 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                }));
            } else {
                allMovies = [];
            }
        } catch (_) {
            allMovies = [];
        }

        currentList = allMovies;
        renderGrid(currentList);
    };

    /* ── Search (client-side against allMovies, also tries backend) ── */
    let searchTimer = null;

    const doSearch = async (query) => {
        if (!query.trim()) {
            currentList = allMovies;
            renderGrid(currentList);
            return;
        }

        // Optimistic: filter allMovies immediately
        const quick = allMovies.filter(m =>
            m.title.toLowerCase().includes(query.toLowerCase())
        );
        renderGrid(quick.length ? quick : []);

        // Then try backend search
        try {
            const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success && data.data.results && data.data.results.length > 0) {
                currentList = data.data.results.slice(0, 25).map((item, idx) => ({
                    _id: String(item.id || `s${idx}`),
                    title: item.title || item.name || 'Untitled',
                    _poster: item.poster_path
                        ? imageBase + item.poster_path
                        : 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                }));
                renderGrid(currentList);
            }
        } catch (_) { }
    };

    searchEl.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => doSearch(searchEl.value), 350);
    });

    /* ── Render grid ── */
    const renderGrid = (movies) => {
        grid.innerHTML = '';

        if (!movies.length) {
            grid.innerHTML = '<div class="pw-status">No results found. Try a different title.</div>';
            return;
        }

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = `pw-card${selected.has(movie._id) ? ' selected' : ''}`;
            card.dataset.id = movie._id;

            card.innerHTML = `
                <div class="pw-poster-wrap">
                    <div class="pw-tick" aria-label="Selected">
                        <svg width="14" height="14" fill="none" stroke="#fff" stroke-width="3"
                             stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <img class="pw-poster" src="${movie._poster}" alt="${movie.title}" loading="lazy"
                         onerror="this.src='https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'">
                </div>
                <span class="pw-title">${movie.title}</span>`;

            card.addEventListener('click', () => toggleSelect(movie._id, card));
            grid.appendChild(card);
        });

        // Animate in
        grid.style.animation = 'none';
        grid.offsetHeight;
        grid.style.animation = 'fadeUp 0.4s ease-out forwards';
    };

    /* ── Toggle selection ── */
    const toggleSelect = (id, card) => {
        if (selected.has(id)) {
            selected.delete(id);
            card.classList.remove('selected');
        } else {
            if (selected.size >= MAX_SELECT) {
                // Shake the count box as visual feedback
                const box = document.getElementById('pw-count-box');
                box.style.animation = 'none';
                box.offsetHeight;
                box.style.animation = 'shake 0.4s ease';
                return;
            }
            selected.add(id);
            card.classList.add('selected');
        }
        updateCounter();
    };

    /* ── Update floating counter and submit button ── */
    const updateCounter = () => {
        const n = selected.size;
        countEl.textContent = n;
        submitBtn.disabled = n === 0;
    };

    /* ── Submit: navigate to recommendations ── */
    submitBtn.addEventListener('click', () => {
        if (selected.size === 0) return;
        const ids = [...selected].join(',');
        window.location.href = `results.html?type=movie&watchlist=${encodeURIComponent(ids)}`;
    });

    /* ── Init ── */
    await loadTopMovies();
});
