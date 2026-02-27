document.addEventListener('DOMContentLoaded', () => {
    const resultsGrid = document.getElementById('results-paginated');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const pageNumbersContainer = document.querySelector('.page-numbers');

    let imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    let allResults = [];
    let currentPage = 1;
    const itemsPerPage = 8; // 4 columns, 2 rows max per logic

    // Initialize
    const init = async () => {
        await fetchConfig();
        await loadResultsFromParams();
    };

    // 1. Fetch TMDB configuration mapping from backend
    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            if (data.success && data.data.images) {
                imageBaseUrl = data.data.images.secure_base_url + 'w500';
            }
        } catch (error) {
            console.error('Failed to load TMDB config:', error);
        }
    };

    // 2. Read URL params, fetch data, and prep pagination
    const loadResultsFromParams = async () => {
        resultsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; margin-top: 50px; font-family: Syne; font-size: 1.5rem;">Finding the perfect watch...</div>';

        // Simulate network delay for effect
        setTimeout(() => {
            // Generate 50 placeholder movies
            const dummyMovies = [];
            const genericPosters = [
                'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // The Shawshank Redemption
                'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Godfather
                'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
                'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVNDjZvqVZEN.jpg', // 12 Angry Men
                'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', // Schindler's List
                'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', // Lord of the Rings: Return of the King
                'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPbOYKQwsc.jpg',  // Pulp Fiction
                'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANm4lk56.jpg'  // Forrest Gump
            ];

            for (let i = 1; i <= 50; i++) {
                dummyMovies.push({
                    title: `Top Rated Movie #${i}`,
                    _custom_poster: genericPosters[i % genericPosters.length],
                    vote_average: (9.9 - (i * 0.05))
                });
            }

            allResults = dummyMovies;
            renderPage(1);
        }, 600);
    };

    // 3. Render a specific page of 8 items
    const renderPage = (page) => {
        currentPage = page;
        resultsGrid.innerHTML = '';

        if (allResults.length === 0) {
            resultsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; margin-top: 50px; font-family: Syne; font-size: 1.5rem;">No results found. Try adjusting your preferences securely.</div>';
            updatePaginationControls();
            return;
        }

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = allResults.slice(startIndex, endIndex);

        pageItems.forEach(item => {
            const title = item.title || item.name;
            const posterUrl = item._custom_poster;
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

            const card = document.createElement('div');
            card.className = 'strict-movie-card';

            const imgHtml = posterUrl
                ? `<img class="strict-poster" src="${posterUrl}" alt="${title} Poster">`
                : `<div class="strict-poster" style="display:flex; align-items:center; justify-content:center; text-align:center; padding: 1rem;">No Poster</div>`;

            card.innerHTML = `
                ${imgHtml}
                <div class="strict-card-info">
                    <h3>${title}</h3>
                    <div class="strict-rating">⭐ ${rating}</div>
                </div>
            `;
            resultsGrid.appendChild(card);
        });

        // Trigger reflow for animation
        resultsGrid.style.animation = 'none';
        resultsGrid.offsetHeight; // trigger reflow
        resultsGrid.style.animation = 'fadeUp 0.5s ease-out forwards';

        updatePaginationControls();
    };

    // 4. Update Prev/Next buttons and page numbers
    const updatePaginationControls = () => {
        const totalPages = Math.ceil(allResults.length / itemsPerPage);

        // Hide Prev/Next text buttons as user prefers just numbers
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';

        // Clear existing numbers
        pageNumbersContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const numBtn = document.createElement('button');
            numBtn.className = `page-num-btn ${i === currentPage ? 'active' : ''}`;
            numBtn.textContent = i;
            numBtn.addEventListener('click', () => renderPage(i));
            pageNumbersContainer.appendChild(numBtn);
        }
    };

    const showError = (message) => {
        resultsGrid.innerHTML = `<div style="grid-column: 1/-1; color: #fca5a5; text-align: center; background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px;"><h3>Error</h3><p>${message}</p></div>`;
    };

    // Event Listeners for Prev/Next
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) renderPage(currentPage - 1);
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allResults.length / itemsPerPage);
        if (currentPage < totalPages) renderPage(currentPage + 1);
    });

    init();
});
