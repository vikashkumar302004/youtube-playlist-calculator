// Application Logic for YouTube Playlist Length Calculator (API-Keyless Version)

// --- State Management ---
const state = {
    playlistUrl: '',
    playlistMeta: null,
    videos: [], // Array of { id, title, duration, thumbnail, url, checked }
    isLoading: false
};

// --- Demo Data ---
const DEMO_PLAYLIST_META = {
    title: "Demo Course: Full-Stack Web Development Boot Camp",
    channelTitle: "CodeCraft Academy",
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=300&auto=format&fit=crop"
};

const DEMO_VIDEOS = [
    { id: "demo1", title: "1. Introduction to HTML5 & Semantic Web Structure", duration: 750, thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo2", title: "2. CSS Fundamentals: Selectors, Box Model & Typography", duration: 1845, thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo3", title: "3. Mastering Responsive Layouts with CSS Grid & Flexbox", duration: 2450, thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo4", title: "4. JavaScript Essentials: DOM Manipulation and Events", duration: 3525, thumbnail: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo5", title: "5. Understanding Javascript Closures, Scope & Async/Await", duration: 2120, thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo6", title: "6. Connecting APIs: Fetch, Promises, and CORS Demystified", duration: 1610, thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo7", title: "7. Building a Modern Interactive UI Project from Scratch", duration: 5120, thumbnail: "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo8", title: "8. Intro to React: Components, Props & Hooks", duration: 3240, thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo9", title: "9. Building a Multi-page Application with React Router", duration: 2580, thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true },
    { id: "demo10", title: "10. Deploying Projects to Cloud Platforms (Vercel & Netlify)", duration: 1120, thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=200&auto=format&fit=crop", url: "https://youtube.com", checked: true }
];

// --- DOM Elements ---
const el = {
    playlistUrlInput: document.getElementById('playlist-url'),
    btnFetch: document.getElementById('btn-fetch'),
    btnDemo: document.getElementById('btn-demo'),
    
    welcomeMessage: document.getElementById('welcome-message'),
    playlistInfo: document.getElementById('playlist-info'),
    playlistThumb: document.getElementById('playlist-thumb'),
    playlistTitle: document.getElementById('playlist-title'),
    playlistChannel: document.getElementById('playlist-channel'),
    
    statTotalDuration: document.getElementById('stat-total-duration'),
    statTotalCount: document.getElementById('stat-total-count'),
    statSelectedDuration: document.getElementById('stat-selected-duration'),
    statSelectedCount: document.getElementById('stat-selected-count'),
    statAvgDuration: document.getElementById('stat-avg-duration'),
    statRange: document.getElementById('stat-range'),
    
    speed125: document.getElementById('speed-125'),
    save125: document.getElementById('save-125'),
    speed150: document.getElementById('speed-150'),
    save150: document.getElementById('save-150'),
    speed175: document.getElementById('speed-175'),
    save175: document.getElementById('save-175'),
    speed200: document.getElementById('speed-200'),
    save200: document.getElementById('save-200'),
    
    btnSelectAll: document.getElementById('btn-select-all'),
    btnDeselectAll: document.getElementById('btn-deselect-all'),
    videoSearch: document.getElementById('video-search'),
    videoList: document.getElementById('video-list'),
    emptyListView: document.getElementById('empty-list-view'),
    videoSort: document.getElementById('video-sort'),
    
    customSpeedSlider: document.getElementById('custom-speed-slider'),
    customSpeedLabel: document.getElementById('custom-speed-label'),
    customSpeedTime: document.getElementById('custom-speed-time'),
    customSpeedSave: document.getElementById('custom-speed-save'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnExportJson: document.getElementById('btn-export-json'),
    
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load cached last loaded playlist URL
    const cachedUrl = localStorage.getItem('yt_playlist_last_url');
    if (cachedUrl) {
        el.playlistUrlInput.value = cachedUrl;
    }

    // Attach Event Listeners
    el.btnFetch.addEventListener('click', handleCalculate);
    el.btnDemo.addEventListener('click', loadDemoMode);
    el.btnSelectAll.addEventListener('click', () => toggleAllCheckboxes(true));
    el.btnDeselectAll.addEventListener('click', () => toggleAllCheckboxes(false));
    el.videoSearch.addEventListener('input', handleSearch);
    el.videoSort.addEventListener('change', handleSortChange);
    el.customSpeedSlider.addEventListener('input', handleCustomSpeedChange);
    el.btnExportCsv.addEventListener('click', exportCSV);
    el.btnExportJson.addEventListener('click', exportJSON);
    
    // Delegate video row events (checkboxes + watched checkmarks)
    el.videoList.addEventListener('change', handleCheckboxChange);
    el.videoList.addEventListener('click', handleWatchedClick);
});

// --- UI Utility Functions ---

// Show Toast notifications
let toastTimeout;
function showToast(message, isError = true) {
    clearTimeout(toastTimeout);
    el.toastMessage.textContent = message;
    
    const icon = el.toast.querySelector('.toast-icon');
    if (isError) {
        el.toast.style.borderColor = 'var(--accent-rose)';
        icon.className = 'fa-solid fa-circle-exclamation text-danger';
    } else {
        el.toast.style.borderColor = 'var(--accent-emerald)';
        icon.className = 'fa-solid fa-circle-check text-success';
        icon.style.color = 'var(--accent-emerald)';
    }
    
    el.toast.classList.remove('hidden');
    
    toastTimeout = setTimeout(() => {
        el.toast.classList.add('hidden');
    }, 4000);
}

// Show/Hide Loader
function setLoaderState(loading) {
    state.isLoading = loading;
    if (loading) {
        el.emptyListView.innerHTML = `
            <div class="spinner-overlay">
                <div class="spinner"></div>
                <p>Fetching and analyzing playlist data (this may take a few seconds)...</p>
            </div>
        `;
        el.emptyListView.classList.remove('hidden');
        el.videoList.classList.add('hidden');
    } else {
        el.emptyListView.classList.add('hidden');
    }
}

// Format duration in seconds to a human readable string (e.g. 1d 4h 30m 15s)
function formatDuration(totalSeconds) {
    if (totalSeconds <= 0) return '0s';
    
    const days = Math.floor(totalSeconds / (24 * 3600));
    let remainder = totalSeconds % (24 * 3600);
    
    const hours = Math.floor(remainder / 3600);
    remainder %= 3600;
    
    const minutes = Math.floor(remainder / 60);
    const seconds = remainder % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
}

// Format duration to digital timer style (HH:MM:SS)
function formatDigitalTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Format video row duration (e.g. '04:12' or '1:12:05')
function formatRowDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    
    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
}

// --- Calculation Engine ---
function updateCalculations() {
    const totalVideos = state.videos.length;
    const selectedVideos = state.videos.filter(v => v.checked);
    
    // 1. Total Duration of ALL videos
    const totalSecondsAll = state.videos.reduce((sum, v) => sum + v.duration, 0);
    el.statTotalDuration.textContent = formatDuration(totalSecondsAll);
    el.statTotalCount.textContent = `${totalVideos} Video${totalVideos !== 1 ? 's' : ''}`;
    
    // 2. Selected Duration
    const totalSecondsSelected = selectedVideos.reduce((sum, v) => sum + v.duration, 0);
    el.statSelectedDuration.textContent = formatDuration(totalSecondsSelected);
    el.statSelectedCount.textContent = `${selectedVideos.length} of ${totalVideos} Selected`;
    
    // 3. Average Duration (based on checked/selected videos)
    const avgSeconds = selectedVideos.length > 0 ? Math.round(totalSecondsSelected / selectedVideos.length) : 0;
    el.statAvgDuration.textContent = formatDuration(avgSeconds);
    
    // Min/Max values
    if (selectedVideos.length > 0) {
        const durations = selectedVideos.map(v => v.duration);
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        el.statRange.textContent = `Shortest: ${formatRowDuration(minDuration)} | Longest: ${formatRowDuration(maxDuration)}`;
    } else {
        el.statRange.textContent = `Shortest: - | Longest: -`;
    }
    
    // 4. Speed Multipliers (based on selected videos)
    calculateSpeedRow(1.25, totalSecondsSelected, el.speed125, el.save125);
    calculateSpeedRow(1.50, totalSecondsSelected, el.speed150, el.save150);
    calculateSpeedRow(1.75, totalSecondsSelected, el.speed175, el.save175);
    calculateSpeedRow(2.00, totalSecondsSelected, el.speed200, el.save200);
    
    // 5. Custom Speed Calculation
    handleCustomSpeedChange();

    // 6. Watch Progress Calculations
    const completedVideos = state.videos.filter(v => v.watched);
    const progressPercent = totalVideos > 0 ? Math.round((completedVideos.length / totalVideos) * 100) : 0;
    
    const progressValEl = document.getElementById('stat-progress-val');
    const progressBarEl = document.getElementById('stat-progress-bar');
    const progressDescEl = document.getElementById('stat-progress-desc');
    
    if (progressValEl && progressBarEl && progressDescEl) {
        progressValEl.textContent = `${progressPercent}%`;
        progressBarEl.style.width = `${progressPercent}%`;
        progressDescEl.textContent = `${completedVideos.length} of ${totalVideos} videos completed`;
    }
}

function calculateSpeedRow(speed, totalSeconds, speedEl, saveEl) {
    if (totalSeconds <= 0) {
        speedEl.textContent = "00:00:00";
        saveEl.textContent = "0m";
        return;
    }
    
    const durationAtSpeed = Math.round(totalSeconds / speed);
    const secondsSaved = totalSeconds - durationAtSpeed;
    
    speedEl.textContent = formatDigitalTime(durationAtSpeed);
    saveEl.textContent = formatDuration(secondsSaved);
}

// --- DOM Rendering ---
function renderVideoList() {
    if (state.videos.length === 0) {
        el.videoList.classList.add('hidden');
        el.emptyListView.classList.remove('hidden');
        el.emptyListView.innerHTML = `
            <i class="fa-solid fa-play"></i>
            <p>No videos found in this playlist.</p>
        `;
        return;
    }
    
    el.emptyListView.classList.add('hidden');
    el.videoList.innerHTML = '';
    
    state.videos.forEach((video) => {
        const videoRow = document.createElement('div');
        videoRow.className = `video-row ${video.watched ? 'is-watched' : ''}`;
        videoRow.dataset.id = video.id;
        
        videoRow.innerHTML = `
            <div class="video-checkbox-wrapper">
                <input type="checkbox" class="video-checkbox" ${video.checked ? 'checked' : ''} id="chk-${video.id}">
            </div>
            <div class="video-index">${(video.originalIndex ?? 0) + 1}</div>
            <img class="video-thumb" src="${video.thumbnail}" alt="" loading="lazy">
            <div class="video-details">
                <div class="video-title">
                    <a href="${video.url}" target="_blank" rel="noopener">${escapeHTML(video.title)}</a>
                </div>
                <div class="video-duration">
                    <i class="fa-solid fa-hourglass"></i> ${formatRowDuration(video.duration)}
                </div>
            </div>
            <div class="video-actions">
                <button class="btn-watched ${video.watched ? 'completed' : ''}" title="${video.watched ? 'Mark Uncompleted' : 'Mark Completed'}">
                    <i class="fa-solid fa-circle-check"></i>
                </button>
            </div>
        `;
        
        el.videoList.appendChild(videoRow);
    });
    
    el.videoList.classList.remove('hidden');
}

// Safe HTML Escape
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- Actions & Handlers ---

// Handle the user clicking "Calculate"
async function handleCalculate() {
    const inputUrl = el.playlistUrlInput.value.trim();
    
    if (!inputUrl) {
        showToast("Please enter a YouTube playlist link or ID.");
        el.playlistUrlInput.focus();
        return;
    }
    
    // Save to local storage
    localStorage.setItem('yt_playlist_last_url', inputUrl);
    state.playlistUrl = inputUrl;
    
    setLoaderState(true);
    
    try {
        // Send request to our Node.js server proxy API
        const response = await fetch(`/api/playlist?url=${encodeURIComponent(inputUrl)}`);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch playlist data.');
        }
        
        const data = await response.json();
        
        // Update state
        state.playlistMeta = {
            title: data.title,
            channelTitle: data.channelTitle,
            thumbnail: data.thumbnail
        };
        
        // Pre-check all loaded videos and store original indices & watched defaults
        state.videos = (data.videos || []).map((v, idx) => ({
            ...v,
            originalIndex: idx,
            checked: true,
            watched: false
        }));
        
        // Reset sort dropdown to original order
        if (el.videoSort) el.videoSort.value = 'original';
        
        // Render playlist metadata
        el.playlistTitle.textContent = data.title;
        el.playlistChannel.innerHTML = `<i class="fa-solid fa-user"></i> ${data.channelTitle}`;
        if (data.thumbnail) {
            el.playlistThumb.src = data.thumbnail;
            el.playlistThumb.classList.remove('hidden');
        } else {
            el.playlistThumb.classList.add('hidden');
        }
        
        el.welcomeMessage.classList.add('hidden');
        el.playlistInfo.classList.remove('hidden');
        
        // Render videos and update calculations
        setLoaderState(false);
        renderVideoList();
        updateCalculations();
        
        showToast("Playlist loaded successfully!", false);
        
    } catch (error) {
        console.error(error);
        setLoaderState(false);
        showToast(error.message || "An error occurred while fetching playlist data.");
    }
}

// Load simulated demo data for evaluation
function loadDemoMode() {
    setLoaderState(true);
    
    // Artificial delay to simulate real network request
    setTimeout(() => {
        state.playlistMeta = DEMO_PLAYLIST_META;
        // Deep copy of demo videos and store original indices & watched defaults
        state.videos = DEMO_VIDEOS.map((v, idx) => ({ 
            ...v, 
            originalIndex: idx,
            watched: false
        }));
        
        // Reset sort dropdown to original order
        if (el.videoSort) el.videoSort.value = 'original';
        
        // Render playlist metadata
        el.playlistTitle.textContent = DEMO_PLAYLIST_META.title;
        el.playlistChannel.innerHTML = `<i class="fa-solid fa-user"></i> ${DEMO_PLAYLIST_META.channelTitle}`;
        el.playlistThumb.src = DEMO_PLAYLIST_META.thumbnail;
        el.playlistThumb.classList.remove('hidden');
        
        el.welcomeMessage.classList.add('hidden');
        el.playlistInfo.classList.remove('hidden');
        
        setLoaderState(false);
        renderVideoList();
        updateCalculations();
        
        showToast("Loaded Demo Playlist! Modify settings to check it out.", false);
    }, 800);
}

// Handle checkbox click (dynamic updates)
function handleCheckboxChange(event) {
    if (event.target.classList.contains('video-checkbox')) {
        const row = event.target.closest('.video-row');
        const videoId = row.dataset.id;
        const video = state.videos.find(v => v.id === videoId);
        if (video) {
            video.checked = event.target.checked;
            updateCalculations();
        }
    }
}

// Toggle select/deselect all checkboxes
function toggleAllCheckboxes(checkedState) {
    if (state.videos.length === 0) return;
    
    state.videos.forEach(v => {
        // Toggle the object state
        v.checked = checkedState;
    });
    
    // Update HTML checkboxes
    const checkBoxes = el.videoList.querySelectorAll('.video-checkbox');
    checkBoxes.forEach(cb => {
        cb.checked = checkedState;
    });
    
    updateCalculations();
}

// Live search filtering
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const rows = el.videoList.querySelectorAll('.video-row');
    
    rows.forEach(row => {
        const id = row.dataset.id;
        const video = state.videos.find(v => v.id === id);
        if (video) {
            const matches = video.title.toLowerCase().includes(query);
            if (matches) {
                row.classList.remove('filtered-out');
            } else {
                row.classList.add('filtered-out');
            }
        }
    });
}

// Handle video sorting
function handleSortChange() {
    const sortType = el.videoSort.value;
    
    if (sortType === 'original') {
        state.videos.sort((a, b) => a.originalIndex - b.originalIndex);
    } else if (sortType === 'shortest') {
        state.videos.sort((a, b) => a.duration - b.duration);
    } else if (sortType === 'longest') {
        state.videos.sort((a, b) => b.duration - a.duration);
    } else if (sortType === 'title') {
        state.videos.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    renderVideoList();
    
    // Keep search filter active if search query is present
    if (el.videoSearch) {
        const query = el.videoSearch.value.toLowerCase().trim();
        if (query) {
            handleSearch({ target: { value: query } });
        }
    }
}

// Handle Custom Speed Change
function handleCustomSpeedChange() {
    if (!el.customSpeedSlider) return;
    const speed = parseFloat(el.customSpeedSlider.value);
    el.customSpeedLabel.textContent = `${speed.toFixed(2)}x`;
    
    const selectedVideos = state.videos.filter(v => v.checked);
    const totalSecondsSelected = selectedVideos.reduce((sum, v) => sum + v.duration, 0);
    
    calculateSpeedRow(speed, totalSecondsSelected, el.customSpeedTime, el.customSpeedSave);
}

// Handle Watched Checkmark clicks
function handleWatchedClick(event) {
    const btn = event.target.closest('.btn-watched');
    if (btn) {
        const row = btn.closest('.video-row');
        const videoId = row.dataset.id;
        const video = state.videos.find(v => v.id === videoId);
        if (video) {
            video.watched = !video.watched;
            row.classList.toggle('is-watched', video.watched);
            btn.classList.toggle('completed', video.watched);
            btn.title = video.watched ? 'Mark Uncompleted' : 'Mark Completed';
            updateCalculations();
        }
    }
}

// Export Playlist to CSV file
function exportCSV() {
    if (state.videos.length === 0) {
        showToast("No playlist loaded to export.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Index,Video ID,Title,Duration (Seconds),URL\n";
    
    state.videos.forEach((v) => {
        const titleEscaped = v.title.replace(/"/g, '""');
        csvContent += `${v.originalIndex + 1},${v.id},"${titleEscaped}",${v.duration},${v.url}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${state.playlistMeta?.title || 'Playlist'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported CSV successfully!", false);
}

// Export Playlist to JSON file
function exportJSON() {
    if (state.videos.length === 0) {
        showToast("No playlist loaded to export.");
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        playlistTitle: state.playlistMeta?.title,
        channel: state.playlistMeta?.channelTitle,
        totalVideos: state.videos.length,
        videos: state.videos.map(v => ({
            index: v.originalIndex + 1,
            id: v.id,
            title: v.title,
            durationSeconds: v.duration,
            url: v.url
        }))
    }, null, 2));
    
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${state.playlistMeta?.title || 'Playlist'}_export.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported JSON successfully!", false);
}
