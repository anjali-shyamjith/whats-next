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

    // Discover content upon button click
    discoverBtn.addEventListener('click', async () => {
        await discoverContent();
    });

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
