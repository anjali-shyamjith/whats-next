document.addEventListener('DOMContentLoaded', async () => {
    const contentEl = document.getElementById('detail-content');
    const backBtn = document.getElementById('back-btn');
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');
    // normalize: fallback 'movie' type for anime/documentary so TMDB accepts it
    const rawType = params.get('type') || 'movie';
    const mediaType = (rawType === 'anime' || rawType === 'documentary') ? 'movie'
        : (rawType === 'tv' ? 'tv' : 'movie');

    // Wire the back button to the exact results page the user came from
    const fromUrl = params.get('from');
    if (backBtn) {
        backBtn.href = fromUrl ? decodeURIComponent(fromUrl) : 'results.html';
    }

    /* ── image config (already embedded in detail response, but handy for profile pics) ── */
    let profileBase = 'https://image.tmdb.org/t/p/w185';
    let posterBase = 'https://image.tmdb.org/t/p/w780';

    try {
        const r = await fetch('/api/config');
        const data = await r.json();
        if (data.success && data.data.images) {
            profileBase = data.data.images.secure_base_url + 'w185';
            posterBase = data.data.images.secure_base_url + 'w780';
        }
    } catch (_) { }

    /* ── Fallback demo data (shown when no id supplied or API fails) ── */
    const FALLBACK = {
        title: 'The Shawshank Redemption',
        synopsis: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank State Penitentiary, where he puts his accounting skills to work for an amoral warden.',
        poster_url: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        rating: 9.3,
        release_date: '1994-09-23',
        runtime: 142,
        genres: [{ name: 'Drama' }, { name: 'Crime' }],
        cast: [
            { name: 'Tim Robbins', character: 'Andy Dufresne', profile_path: null },
            { name: 'Morgan Freeman', character: 'Ellis Boyd Redding', profile_path: null },
            { name: 'Bob Gunton', character: 'Warden Norton', profile_path: null },
            { name: 'William Sadler', character: 'Heywood', profile_path: null },
            { name: 'Clancy Brown', character: 'Captain Hadley', profile_path: null },
            { name: 'Gil Bellows', character: 'Tommy', profile_path: null },
        ],
        crew: [
            { name: 'Frank Darabont', job: 'Director', profile_path: null },
            { name: 'Frank Darabont', job: 'Screenplay', profile_path: null },
            { name: 'Niki Marvin', job: 'Producer', profile_path: null },
            { name: 'Roger Deakins', job: 'Director of Photography', profile_path: null },
        ],
    };

    /* ── Fetch from /api/details/:type/:id ── */
    const fetchDetail = async (id, type) => {
        try {
            const res = await fetch(`/api/details/${type}/${id}`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (_) {
            return null;
        }
    };

    /* ── Build avatar URL ── */
    const avatarUrl = (profilePath, name) => {
        if (profilePath) return profileBase + profilePath;
        // Generate letter-avatar as fallback
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=231A42&color=9B8EC4&size=128&bold=true&rounded=true`;
    };

    /* ── Build a single person card ── */
    const makePersonCard = (name, role, profilePath) => {
        const photo = avatarUrl(profilePath, name);
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div class="person-photo-wrap">
                <img class="person-photo" src="${photo}" alt="${name}" loading="lazy"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=231A42&color=9B8EC4&size=128&bold=true&rounded=true'">
            </div>
            <span class="person-name">${name}</span>
            <span class="person-role">${role || ''}</span>`;
        return card;
    };

    /* ── Render full detail view ── */
    const render = (movie) => {
        const title = movie.title || 'Untitled';
        const synopsis = movie.synopsis || movie.overview || 'No summary available.';
        const rating = movie.rating != null ? (+movie.rating).toFixed(1)
            : (movie.vote_average != null ? (+movie.vote_average).toFixed(1) : 'N/A');
        const year = (movie.release_date || '').slice(0, 4);
        const runtime = movie.runtime ? `${movie.runtime} min` : '';
        const genres = (movie.genres || []).map(g => g.name).join(', ') || '';

        // Poster: prefer high-res url already built by backend, fall back to building from path
        const posterUrl = movie.poster_url
            || (movie.poster_path ? posterBase + movie.poster_path : 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg');

        // Meta chips
        const chips = [year, runtime, genres].filter(Boolean)
            .map(v => `<span class="meta-chip">${v}</span>`).join('');

        contentEl.innerHTML = `
            <div class="detail-main">
                <!-- Left: Poster -->
                <div class="detail-poster-col">
                    <img class="detail-poster" src="${posterUrl}" alt="${title} Poster"
                         onerror="this.src='https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'">
                </div>

                <!-- Right: Info -->
                <div class="detail-info-col">
                    <div class="detail-title-row">
                        <h2 class="detail-title">${title}</h2>
                        <span class="detail-rating-badge">⭐ ${rating}&thinsp;/&thinsp;10</span>
                    </div>
                    <div class="detail-meta">${chips}</div>
                    <p class="detail-summary">${synopsis}</p>
                </div>
            </div>

            <!-- Cast -->
            <hr class="section-divider">
            <section class="people-section">
                <h3 class="people-section-title">Cast</h3>
                <div class="people-scroll" id="cast-scroll"></div>
            </section>

            <!-- Crew -->
            <hr class="section-divider">
            <section class="people-section">
                <h3 class="people-section-title">Crew</h3>
                <div class="people-scroll" id="crew-scroll"></div>
            </section>`;

        // Populate cast
        const castScroll = document.getElementById('cast-scroll');
        const castList = (movie.cast || []).slice(0, 24);
        if (castList.length) {
            castList.forEach(p => castScroll.appendChild(makePersonCard(p.name, p.character, p.profile_path)));
        } else {
            castScroll.innerHTML = '<span class="people-empty">No cast information available.</span>';
        }

        // Populate crew (filter to key roles only)
        const crewScroll = document.getElementById('crew-scroll');
        const KEY_JOBS = ['Director', 'Producer', 'Executive Producer', 'Screenplay', 'Story', 'Writer', 'Director of Photography', 'Composer'];
        const crewList = (movie.crew || []).filter(p => KEY_JOBS.includes(p.job)).slice(0, 16);
        if (crewList.length) {
            crewList.forEach(p => crewScroll.appendChild(makePersonCard(p.name, p.job, p.profile_path)));
        } else {
            crewScroll.innerHTML = '<span class="people-empty">No crew information available.</span>';
        }

        document.title = `What's Next? – ${title}`;
    };

    /* ── Init ── */
    if (!movieId) {
        render(FALLBACK);
        return;
    }

    const movie = await fetchDetail(movieId, mediaType);
    render(movie || FALLBACK);
});
