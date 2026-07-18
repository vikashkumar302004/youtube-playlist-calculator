# PlayTime: YouTube Playlist Length & Watch Time Calculator

PlayTime is a lightweight, responsive web application designed to calculate the total running time, playback speed adjustments, and watch progress of any public YouTube playlist. 

Unlike traditional playlist calculators, PlayTime operates entirely **without requiring a Google API Key** or configuration, using a local Node.js proxy to fetch playlist items on-demand.

---

## Features

- **No API Key Needed**: Leverages a headless backend proxy to retrieve playlist details directly from YouTube's client endpoints.
- **Watch Progress Tracker**: Interactive checkmarks allow users to mark videos as completed, rendering a real-time progress bar (percentage and counts) to track learning courses.
- **Custom Video Selection**: Check/uncheck specific videos to exclude them from calculations, dynamically updating totals.
- **Custom Playback Speed Slider**: Calculate adjusted durations from 0.25x to 3.0x speed, displaying the exact hours saved.
- **Data Exporters**: Download the loaded playlist's metadata, URLs, and durations as structured CSV or JSON files.
- **Advanced Sorting & Searching**: Filter list items instantly by title or sort them by duration (Shortest/Longest first), alphabetical order, or default playlist order.
- **Dark Mode Aesthetic**: A responsive dashboard styled with a dark glassmorphic UI, harmonized gradients, and customized scrollbars.

---

## Architecture

PlayTime separates client interactions from content retrieval to handle CORS restrictions and bypass YouTube Data API quota limitations.

```
+-----------------------------------------------------------+
|                      Client Browser                       |
|   (HTML5, CSS Variables, ES6 JavaScript Event Handlers)   |
+-----------------------------+-----------------------------+
                              |
                     1. HTTP GET Request
              /api/playlist?url=<playlist_url>
                              |
                              v
+-----------------------------------------------------------+
|                    Local Node.js Server                   |
|                      (Express Framework)                  |
+-----------------------------+-----------------------------+
                              |
                    2. Scrapes Playlist
                      (youtubei.js client)
                              |
                              v
+-----------------------------------------------------------+
|                    YouTube InnerTube API                  |
|               (Asynchronous JSON endpoints)               |
+-----------------------------------------------------------+
```

1. **Client Interaction**: The user enters a playlist URL or ID. The client sends a GET request to the local `/api/playlist` endpoint.
2. **Backend Proxy**: The Express server initializes a headless `Innertube` client. It extracts the playlist ID and fetches the initial data.
3. **Continuation Handling**: If the playlist exceeds 100 videos, the backend loops recursively to fetch continuation tokens until the entire list is loaded (safeguarded at 2,000 items).
4. **Data Normalization**: The backend extracts titles, video IDs, medium-resolution thumbnails, and parses human-readable duration texts into total seconds, returning a clean JSON response.
5. **Client Engine**: The client parses the JSON, structures state arrays, renders components dynamically, and updates stats cards when checkboxes are toggled.

---

## Local Setup

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

1. Clone the repository and navigate into the project directory:
   ```bash
   cd youtube-playlist-calculator
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`.

---

## Deployment

The application is structured to run as a Node.js web server. You can deploy it for free on Vercel or Render.

### Deploy to Vercel (Serverless)
The project includes a pre-configured `vercel.json` and exports the Express app instance from `server.js` to run on Vercel's serverless environment.

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Initialize deployment:
   ```bash
   vercel
   ```
3. Set up the project configurations using the terminal prompts and run the production deployment:
   ```bash
   vercel --prod
   ```

### Deploy to Render
1. Push the code to a GitHub repository.
2. Create a new **Web Service** on Render.com and connect your repository.
3. Set **Runtime** to `Node`, **Build Command** to `npm install`, and **Start Command** to `npm start`.

---

## License

This project is licensed under the MIT License.
