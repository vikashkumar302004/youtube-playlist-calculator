module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const playlistUrl = req.query.url;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'Playlist URL or ID is required' });
    }

    try {
        const { Innertube, UniversalCache } = await import('youtubei.js');
        console.log(`[Vercel Serverless] Initializing Innertube client...`);
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            enable_session_cache: false
        });
        
        let playlistId = playlistUrl.trim();
        if (playlistId.includes('list=')) {
            const match = playlistId.match(/[&?]list=([^&]+)/);
            if (match && match[1]) {
                playlistId = match[1];
            }
        }
        
        console.log(`[Vercel Serverless] Fetching playlist data for ID: ${playlistId}`);
        const playlist = await yt.getPlaylist(playlistId);
        
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or is private' });
        }
        
        let videos = [...playlist.videos];
        let currentPlaylist = playlist;
        let pagesCount = 1;
        
        // Loop recursively to handle paginated continuation lists (limit to 10 pages / 1000 videos to stay under Serverless timeout)
        while (currentPlaylist.has_continuation && pagesCount < 10) {
            currentPlaylist = await currentPlaylist.getContinuation();
            if (currentPlaylist && currentPlaylist.videos) {
                videos.push(...currentPlaylist.videos);
                pagesCount++;
            } else {
                break;
            }
        }

        // Helper to parse YouTube duration text (e.g., "1:23:45" or "4:32" or "12") into seconds
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
        
        const responseData = {
            title: playlist.info?.title || 'YouTube Playlist',
            channelTitle: playlist.info?.author?.name || 'Unknown Channel',
            thumbnail: playlist.info?.thumbnail?.thumbnails?.[0]?.url || '',
            videos: videos.map(v => {
                const id = v.id;
                const title = v.title?.text || v.title || 'Untitled Video';
                const thumbnail = v.thumbnail?.thumbnails?.[0]?.url || '';
                
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

        res.status(200).json(responseData);
    } catch (error) {
        console.error('[Vercel Serverless] Error fetching playlist:', error.message || error);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch playlist data. Make sure the URL is correct and the playlist is public.' 
        });
    }
};
