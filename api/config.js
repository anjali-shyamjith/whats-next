export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Fetch TMDB config directly from the external API using the environment variable
            const tmdbApiKey = process.env.TMDB_API_KEY;

            if (!tmdbApiKey) {
                return res.status(500).json({
                    success: false,
                    message: 'Server missing TMDB_API_KEY environment variable.'
                });
            }

            const tmdbConfigRes = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${tmdbApiKey}`);
            const tmdbConfigData = await tmdbConfigRes.json();

            if (tmdbConfigRes.ok) {
                res.status(200).json({ success: true, data: tmdbConfigData });
            } else {
                res.status(tmdbConfigRes.status).json({
                    success: false,
                    message: tmdbConfigData.status_message || 'Failed to fetch TMDB config from external API'
                });
            }
        } catch (error) {
            console.error('Error in /api/config:', error);
            res.status(500).json({ success: false, message: 'Internal server error fetching TMDB config.' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
