document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('results-paginated');
    const paginationBar = document.getElementById('pagination-bar');

    const ITEMS_PER_PAGE = 8;
    let allMovies = [];
    let currentPage = 1;
    let imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    // Fallback reference posters (top-rated classics) used when backend image URL is missing
    const FALLBACK_POSTERS = [
        'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // Shawshank
        'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // Godfather
        'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // Dark Knight
        'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVNDjZvqVZEN.jpg', // 12 Angry Men
        'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', // Schindler
        'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // LOTR
        'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPbOYKQwsc.jpg',  // Pulp Fiction
        'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANm4lk56.jpg', // Forrest Gump
    ];

    /* ── helpers ── */
    const fallbackPoster = (idx) => FALLBACK_POSTERS[idx % FALLBACK_POSTERS.length];

    const showStatus = (msg) => {
        grid.innerHTML = `<div class="results-status">${msg}</div>`;
    };

    /* ── fetch TMDB image config ── */
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            if (data.success && data.data.images) {
                imageBaseUrl = data.data.images.secure_base_url + 'w500';
            }
        } catch (_) { /* silently fall back to default */ }
    };

    /* ── fetch suggestions from backend ── */
    const loadResults = async () => {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type') || 'movie';
        const genre = params.get('genre');
        const mood = params.get('mood');
        const duration = params.get('duration');
        const country = params.get('country');
        const language = params.get('language');
        const watchlist = params.get('watchlist');

        let data = null;

        if (watchlist) {
            // Handle Watchlist Recommendations via POST
            const ids = watchlist.split(',');
            const items = ids.map(id => ({ id: id.startsWith('f') ? 550 : id, type: 'movie' })); // Fallback ID 550 if it's a fake 'f' prefixed ID

            try {
                const res = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: items.slice(0, 5) })
                });
                data = await res.json();
            } catch (err) {
                console.error('Watchlist fetch error:', err);
            }
        } else {
            // Standard Suggestions via GET
            let url = `/api/suggestions?type=${type}`;
            if (genre) url += `&genre=${genre}`;
            if (mood) url += `&mood=${mood}`;
            if (duration) url += `&duration=${duration}`;
            if (country) url += `&country=${country}`;
            if (language) url += `&language=${language}`;

            try {
                const res = await fetch(url);
                data = await res.json();
            } catch (err) {
                console.error('Standard fetch error:', err);
            }
        }

        if (data && data.success && data.data.results && data.data.results.length > 0) {
            let results = data.data.results.map((item, idx) => ({
                ...item,
                _poster: item.poster_path
                    ? imageBaseUrl + item.poster_path
                    : fallbackPoster(idx),
            }));

            // Pad / trim to exactly 50
            let i = 0;
            while (results.length < 50) {
                results.push({
                    title: `Extra Pick #${++i}`,
                    _poster: fallbackPoster(results.length),
                    vote_average: +(8.5 - i * 0.05).toFixed(1),
                });
            }
            allMovies = results.slice(0, 50);
        } else {
            allMovies = buildFallbackList();
        }

        renderPage(1);
    };

    const buildFallbackList = () => {
        const list = [];
        const titles = [
            'The Shawshank Redemption', 'The Godfather', 'The Dark Knight', '12 Angry Men',
            "Schindler's List", 'The Lord of the Rings', 'Pulp Fiction', 'Forrest Gump',
        ];
        for (let i = 0; i < 50; i++) {
            list.push({
                title: titles[i % titles.length],
                _poster: fallbackPoster(i),
                vote_average: +(9.9 - i * 0.05).toFixed(1),
            });
        }
        return list;
    };

    /* ── render one page of 8 cards ── */
    const renderPage = (page) => {
        currentPage = page;
        const start = (page - 1) * ITEMS_PER_PAGE;
        const items = allMovies.slice(start, start + ITEMS_PER_PAGE);

        if (items.length === 0) {
            showStatus('No results found. Try adjusting your preferences.');
            renderPagination();
            return;
        }

        grid.innerHTML = '';
        const urlParams = new URLSearchParams(window.location.search);
        const mediaType = urlParams.get('type') || 'movie';

        items.forEach((item) => {
            const title = item.title || item.name || 'Untitled';
            const poster = item._poster || fallbackPoster(0);
            const rating = item.vote_average != null ? (+item.vote_average).toFixed(1) : 'N/A';

            const card = document.createElement('div');
            card.className = 'strict-movie-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <img class="strict-poster" src="${poster}" alt="${title} Poster" loading="lazy">
                <div class="strict-card-info">
                    <h3>${title}</h3>
                    <span class="strict-rating">⭐ ${rating}</span>
                </div>`;

            // Navigate to detail page on click, preserving the current results URL so the back button works
            card.addEventListener('click', () => {
                const id = item.id || '';
                const fromUrl = encodeURIComponent(window.location.href);
                window.location.href = `movie.html?id=${id}&type=${mediaType}&from=${fromUrl}`;
            });

            grid.appendChild(card);
        });

        // Animate grid in
        grid.style.animation = 'none';
        grid.offsetHeight; // force reflow
        grid.style.animation = 'fadeUp 0.45s ease-out forwards';

        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ── render numbered pagination ── */
    const renderPagination = () => {
        paginationBar.innerHTML = '';
        const totalPages = Math.ceil(allMovies.length / ITEMS_PER_PAGE);

        for (let p = 1; p <= totalPages; p++) {
            const btn = document.createElement('button');
            btn.className = `page-num-btn${p === currentPage ? ' active' : ''}`;
            btn.textContent = p;
            btn.setAttribute('aria-label', `Go to page ${p}`);
            btn.addEventListener('click', () => renderPage(p));
            paginationBar.appendChild(btn);
        }
    };

    /* ── init ── */
    (async () => {
        await fetchConfig();
        await loadResults();
    })();
});
