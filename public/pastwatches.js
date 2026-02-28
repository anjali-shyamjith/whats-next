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

    /* ── Helpers ── */
    const FALLBACK_MOVIES = [
        { _id: 'f0', title: 'The Shawshank Redemption', _poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg' },
        { _id: 'f1', title: 'The Godfather', _poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
        { _id: 'f2', title: 'The Dark Knight', _poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
        { _id: 'f3', title: '12 Angry Men', _poster: 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVNDjZvqVZEN.jpg' },
        { _id: 'f4', title: "Schindler's List", _poster: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg' },
        { _id: 'f5', title: 'The Lord of the Rings', _poster: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg' },
        { _id: 'f6', title: 'Pulp Fiction', _poster: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPbOYKQwsc.jpg' },
        { _id: 'f7', title: 'Forrest Gump', _poster: 'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANm4lk56.jpg' },
        { _id: 'f8', title: 'Fight Club', _poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
        { _id: 'f9', title: 'The Matrix', _poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
        { _id: 'f10', title: 'Interstellar', _poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
        { _id: 'f11', title: 'Inception', _poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
        { _id: 'f12', title: 'Goodfellas', _poster: 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg' },
        { _id: 'f13', title: 'The Silence of the Lambs', _poster: 'https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg' },
        { _id: 'f14', title: 'Se7en', _poster: 'https://image.tmdb.org/t/p/w500/69Sns8WoET6CfaYlIkHbla4l7nC.jpg' },
        { _id: 'f15', title: 'The Prestige', _poster: 'https://image.tmdb.org/t/p/w500/5MXyQfz8xUP3dIFPTKe7K3GVTVA.jpg' },
        { _id: 'f16', title: 'Parasite', _poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
        { _id: 'f17', title: 'Spirited Away', _poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
        { _id: 'f18', title: 'Avengers: Endgame', _poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
        { _id: 'f19', title: 'The Lion King', _poster: 'https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg' },
        { _id: 'f20', title: 'Gladiator', _poster: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg' },
        { _id: 'f21', title: 'The Green Mile', _poster: 'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmU1xZu.jpg' },
        { _id: 'f22', title: 'Amélie', _poster: 'https://image.tmdb.org/t/p/w500/wQOHB3C8EDJ35DeTApJBOkL9hqH.jpg' },
        { _id: 'f23', title: 'Whiplash', _poster: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTMe2SgiLCeuedmO.jpg' },
        { _id: 'f24', title: 'Joker', _poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg' },
    ];

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
            const res = await fetch('/api/suggestions?type=movie');
            const data = await res.json();

            if (data.success && data.data.results && data.data.results.length > 0) {
                allMovies = data.data.results.slice(0, 25).map((item, idx) => ({
                    _id: String(item.id || `r${idx}`),
                    title: item.title || item.name || 'Untitled',
                    _poster: item.poster_path
                        ? imageBase + item.poster_path
                        : FALLBACK_MOVIES[idx % FALLBACK_MOVIES.length]._poster,
                }));
            } else {
                allMovies = FALLBACK_MOVIES;
            }
        } catch (_) {
            allMovies = FALLBACK_MOVIES;
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
                        : FALLBACK_MOVIES[idx % FALLBACK_MOVIES.length]._poster,
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
