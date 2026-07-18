const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse duration text formatted as "MM:SS" or "H:MM:SS" into total seconds
function parseDurationText(text) {
    if (!text) return 0;
    const parts = text.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
}

// Endpoint to fetch playlist details without an API key
app.get('/api/playlist', async (req, res) => {
    const playlistUrl = req.query.url;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'Playlist URL or ID is required' });
    }

    try {
        const { Innertube, UniversalCache } = await import('youtubei.js');
        console.log(`[Proxy] Initializing Innertube client...`);
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            enable_session_cache: false
        });
        
        // Extract Playlist ID from URL if necessary
        let playlistId = playlistUrl.trim();
        if (playlistId.includes('list=')) {
            const match = playlistId.match(/[&?]list=([^&]+)/);
            if (match && match[1]) {
                playlistId = match[1];
            }
        }
        
        console.log(`[Proxy] Fetching playlist data for ID: ${playlistId}`);
        const playlist = await yt.getPlaylist(playlistId);
        
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or is private' });
        }

        let rawVideos = [...(playlist.videos || [])];
        let currentPlaylist = playlist;
        let pagesCount = 1;
        const maxPages = 20; // Safeguard to prevent infinite loops (loads up to ~2000 videos)

        while (currentPlaylist.has_continuation && pagesCount < maxPages) {
            console.log(`[Proxy] Fetching continuation page ${pagesCount + 1}...`);
            currentPlaylist = await currentPlaylist.getContinuation();
            if (currentPlaylist.videos) {
                rawVideos.push(...currentPlaylist.videos);
            }
            pagesCount++;
        }

        console.log(`[Proxy] Successfully fetched: "${playlist.info.title}" containing ${rawVideos.length} videos`);

        // Map data to client-expected format
        const responseData = {
            title: playlist.info.title || 'YouTube Playlist',
            channelTitle: playlist.info.author?.name || 'Unknown Channel',
            thumbnail: playlist.info.author?.thumbnails?.[0]?.url || (rawVideos[0]?.content_image?.image?.[0]?.url || ''),
            videos: rawVideos.map(v => {
                const id = v.content_id;
                const title = v.metadata?.title?.text || 'Untitled Video';
                const thumbnail = v.content_image?.image?.[0]?.url || 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=200&auto=format&fit=crop';
                
                // Find duration from overlay badges
                const overlay = v.content_image?.overlays?.find(o => o.type === 'ThumbnailBottomOverlayView');
                const durationText = overlay?.badges?.[0]?.text || '';
                const durationSeconds = parseDurationText(durationText);
                
                return {
                    id: id || '',
                    title: title,
                    duration: durationSeconds,
                    thumbnail: thumbnail,
                    url: id ? `https://www.youtube.com/watch?v=${id}` : 'https://youtube.com'
                };
            })
        };

        res.json(responseData);
    } catch (error) {
        console.error('[Proxy] Error fetching playlist:', error.message || error);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch playlist data. Make sure the URL is correct and the playlist is public.' 
        });
    }
});

// Fallback to index.html for single page routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[Server] YouTube Playlist Calculator is running at http://localhost:${PORT}`);
});

module.exports = app;
