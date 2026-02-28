document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('type-select');
    const genreSelect = document.getElementById('genre-select');
    const discoverBtn = document.getElementById('discover-btn');
    const resultsGrid = document.getElementById('results');

    let imageBaseUrl = 'https://image.tmdb.org/t/p/w500'; // Default fallback

    // --- Sidebar Menu Logic ---
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active class
            menuBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Sync hidden type-select
            typeSelect.value = btn.dataset.type;
            typeSelect.dispatchEvent(new Event('change')); // Triggers genre update
        });
    });

    // Initialize application
    const init = async () => {
        await fetchConfig();
        await fetchGenres(typeSelect.value);
    };

    // Update genres when type changes
    typeSelect.addEventListener('change', async (e) => {
        await fetchGenres(e.target.value);
    });

    // Suggest button → navigate to results page with params
    discoverBtn.addEventListener('click', () => {
        const type = typeSelect.value;
        const genre = genreSelect.value;
        const mood = document.getElementById('mood-select') ? document.getElementById('mood-select').value : '';
        const duration = document.getElementById('duration-select') ? document.getElementById('duration-select').value : '';
        const country = document.getElementById('country-select') ? document.getElementById('country-select').value : '';
        const language = document.getElementById('language-select') ? document.getElementById('language-select').value : '';

        const params = new URLSearchParams({ type });
        if (genre) params.append('genre', genre);
        if (mood) params.append('mood', mood);
        if (duration) params.append('duration', duration);
        if (country) params.append('country', country);
        if (language) params.append('language', language);

        window.location.href = `results.html?${params.toString()}`;
    });

    // Surprise me button → fetch 50 items and pick a random one
    const surpriseBtn = document.getElementById('surprise-btn');
    if (surpriseBtn) {
        surpriseBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const type = typeSelect.value || 'movie';

            // Show loading state on button
            const originalText = surpriseBtn.textContent;
            surpriseBtn.textContent = 'Deciding...';
            surpriseBtn.style.pointerEvents = 'none';

            try {
                const res = await fetch(`/api/suggestions?type=${type}&limit=50`);
                const data = await res.json();

                if (data.success && data.data.results && data.data.results.length > 0) {
                    const results = data.data.results;
                    const randomItem = results[Math.floor(Math.random() * results.length)];

                    // Navigate to movie detail page
                    const fromUrl = encodeURIComponent(window.location.href);
                    window.location.href = `movie.html?id=${randomItem.id}&type=${type}&from=${fromUrl}`;
                } else {
                    alert('Could not find any items to surprise you with. Please try again.');
                }
            } catch (err) {
                console.error('Surprise me fetch error:', err);
                alert('Something went wrong. Please try again.');
            } finally {
                surpriseBtn.textContent = originalText;
                surpriseBtn.style.pointerEvents = '';
            }
        });
    }

    // 1. Fetch TMDB configuration mapping from backend
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            if (data.success && data.data.images) {
                // Ensure secure image load
                imageBaseUrl = data.data.images.secure_base_url + 'w500';
            }
        } catch (error) {
            console.error('Failed to load TMDB config:', error);
        }
    };

    // 2. Fetch genres mapping from backend
    const fetchGenres = async (type) => {
        try {
            const actualType = (type === 'anime' || type === 'tv') ? 'tv' : 'movie';
            const res = await fetch(`/api/genres?type=${actualType}`);
            const data = await res.json();

            // Clear current genres
            genreSelect.innerHTML = '<option value="">Any Genre</option>';

            // Load new genres
            if (data.success && data.data.genres) {
                data.data.genres.forEach(genre => {
                    // Skip specific internal genres we handle automatically in backend
                    if (genre.name === 'Animation' && type === 'anime') return;
                    if (genre.name === 'Documentary' && type === 'documentary') return;

                    const option = document.createElement('option');
                    option.value = genre.id;
                    option.textContent = genre.name;
                    genreSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load genres:', error);
        }
    };

    // 3. Fetch suggestions from backend API
    const discoverContent = async () => {
        const type = typeSelect.value;
        const genre = genreSelect.value;

        // Show loading state and reveal grid if hidden
        resultsGrid.classList.remove('hidden');
        resultsGrid.innerHTML = '<div class="welcome-message"><p>Finding the perfect watch for you...</p></div>';

        try {
            let url = `/api/suggestions?type=${type}`;
            if (genre) url += `&genre=${genre}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success && data.data.results) {
                renderResults(data.data.results);
            } else {
                showError(data.error || 'Check that your TMDB API Key is configured in the backend (.env).');
            }
        } catch (error) {
            console.error('Failed to discover content:', error);
            showError('Failed to connect to the backend server. Is it running?');
        }
    };

    // Render results back to the layout grid
    const renderResults = (results) => {
        resultsGrid.innerHTML = ''; // Clear loading

        if (results.length === 0) {
            resultsGrid.innerHTML = '<div class="welcome-message"><p>No results found for your preferences.</p></div>';
            return;
        }

        results.forEach(item => {
            const title = item.title || item.name;
            const posterPath = item.poster_path;
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

            const card = document.createElement('div');
            card.className = 'movie-card';

            const imgHtml = posterPath
                ? `<img class="poster" src="${imageBaseUrl}${posterPath}" alt="${title} Poster">`
                : `<div class="poster" style="display:flex; align-items:center; justify-content:center; text-align:center; padding: 1rem;">No Poster Available</div>`;

            card.innerHTML = `
                ${imgHtml}
                <div class="card-info">
                    <h3>${title}</h3>
                    <div class="rating">⭐ ${rating}</div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    };

    const showError = (message) => {
        resultsGrid.innerHTML = `<div class="error-message"><h3>Error</h3><p>${message}</p></div>`;
    };

    // Kick it off
    init();
});
