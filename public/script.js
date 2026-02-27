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
    discoverBtn.addEventListener('click', () => {
        const type = typeSelect.value;
        const genre = genreSelect.value;
        const mood = document.getElementById('mood-select').value;
        const duration = document.getElementById('duration-select').value;
        const country = document.getElementById('country-select').value;
        const language = document.getElementById('language-select').value;

        // Build url params
        const params = new URLSearchParams({
            type,
            genre,
            mood,
            duration,
            country,
            language
        });

        // Redirect to new page
        window.location.href = `results.html?${params.toString()}`;
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

    // The discoverContent, renderResults, and showError functions have been 
    // moved conceptually to results logic. They are left here in case the backend 
    // requires them on index.html, but they won't be called on click anymore.
    // They could be deleted if we build a separate results.js.

    // Kick it off
    init();
});
