# Moviebox API Integration Guide

This document outlines how the client application should interact with the Moviebox API backend to successfully retrieve streaming links and download files. 

Because the core Moviebox API (`h5.aoneroom.com`) aggressively blocks automated traffic and cloud datacenter IPs, a specific proxy architecture has been implemented.

## Architecture Overview

The system consists of 3 layers:
1. **The Client App** (Your movie streaming frontend/mobile app)
2. **The Backend API** (FastAPI running on Azure App Service)
3. **The Proxy Layer** (Cloudflare Worker bypassing IP restrictions)

### Why the Proxy Exists
When the Backend API is deployed to Azure, the IP address belongs to a Microsoft Datacenter. Moviebox detects datacenter IPs and silently blocks them by returning `"hasResource": false` for all streaming and download requests. 

To solve this, the Backend API routes all outgoing requests through a **Cloudflare Worker Proxy**. The proxy impersonates a Samsung Android device and attaches a valid `AUTH_TOKEN`, tricking Moviebox into returning the actual video `.mp4` and `.m3u8` links.

---

## 1. Getting Movie/TV Show Links

Your Client App only ever needs to talk to your Azure Backend API. 

### API Endpoint Format
To get streaming or download links for a specific movie or tv show, make a `GET` request to your backend api using the TMDB ID:
* **Movies:** `GET /api/download/movie/{tmdb_id}`
* **TV Shows:** `GET /api/download/tv/{tmdb_id}?s={season}&e={episode}`

### Backend API Workflow (Under the hood)
When your Client App requests a movie, the Backend API performs these steps automatically:
1. Translates the `tmdb_id` to a title using the TMDB API.
2. Searches the Moviebox proxy for that specific title to get the internal `subjectId`.
3. Requests the actual download and streaming links from the proxy using the `subjectId`.
4. Returns the structured JSON response back to the Client App.

---

## 2. Reading the API Response

When the request is successful, the Backend API will return a JSON payload with two main sections: `downloadData` and `externalStreams`.

### 2a. Direct Downloads (MP4)
Inside the `downloadData.data` object, you will see `hasResource: true` if links were successfully bypassed by the proxy.

The `downloads` array contains the physical `.mp4` video files you can download or stream directly in a standard video player.
```json
"downloads": [
    {
        "id": "6929414734379188672",
        "url": "https://bcdnxw.hakunaymatata.com/resource/2f5fe5ae2546e3...mp4",
        "quality": "360",
        "size": "172.5MB"
    },
    {
        "id": "1281900801656520648",
        "url": "https://bcdnxw.hakunaymatata.com/resource/5c8dbdc653eb...mp4",
        "quality": "1080",
        "size": "741.7MB"
    }
]
```
**How to use:** Just plug the `url` directly into your video player's source or a file downloader.

### 2b. Captions/Subtitles
Inside the same `downloadData.data` object, there is a `captions` array containing direct links to `.srt` subtitle files in various languages.
```json
"captions": [
    {
        "id": "2401607322708706792",
        "lan": "en",
        "lanName": "English",
        "url": "https://cacdn.hakunaymatata.com/subtitle/01ec508b...srt",
        "size": 73523,
        "delay": 0
    }
]
```

### 2c. External Streams (HLS/M3U8)
Sometimes you don't want to load a massive MP4 file. The `externalStreams` array provides HLS (`.m3u8`) playlists which dynamically adapt to the user's internet speed.
```json
"externalStreams": [
    {
        "quality": "Auto",
        "url": "https://sflix.film/hls/..."
    }
]
```

---

## 3. Bypassing CDN Blocks (Playing/Downloading the Video)

**CRITICAL:** If you take the `.mp4` URLs (e.g., from `https://bcdnxw.hakunaymatata.com/...`) and put them directly into an HTML `<video>` tag or try to download them via a browser frontend, **they will fail**. 

The CDN servers enforce strict CORS policies and check the `Referer` header to prevent direct hotlinking.

### How to play or download the videos in your Client App:
To bypass this, your client application's backend must act as a **Stream Proxy** for the video files.

**The Workflow:**
1. Your frontend requests the video from *your own backend proxy* (e.g., `https://your-app.com/stream?url=<ENCODED_MP4_URL>`).
2. Your backend takes that target URL and makes a server-to-server request to the CDN.
3. When making the request to the CDN, **your backend MUST include this specific header:**
   `Referer: https://fmoviesunblocked.net/`
4. Your backend streams the video chunks directly back to the frontend.

**Example Next.js / Node Proxy Route for Streaming:**
```javascript
// /api/stream/route.js
export async function GET(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://fmoviesunblocked.net/"  // THIS IS REQUIRED!
    }
  });

  // Forward the video stream to the frontend
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "video/mp4",
      "Access-Control-Allow-Origin": "*", // Bypass CORS for your frontend
    }
  });
}
```
*Note: The FastAPI backend project already includes a powerful `MediaFileDownloader` class that implements this correctly using chunked downloads if you prefer to download them via the python API instead of proxying them to a web client.*

---

## 3. Maintenance & Troubleshooting

Because this API relies on an external, private API (Moviebox), it requires occasional maintenance.

### The `hasResource: false` Error
If your Client App suddenly starts receiving empty download arrays and `"hasResource": false`, it means **your proxy Auth Token has expired**.

**How to fix:**
1. Open the Moviebox app on a real device or emulator.
2. Intercept the network traffic (using a tool like PCAPdroid, HTTP Toolkit, or Charles Proxy).
3. Find any request to `h5.aoneroom.com` and copy the `Authorization` header token (`Bearer eyJhbG...`).
4. Open your Cloudflare Worker script (`worker.js`).
5. Update the `AUTH_TOKEN` variable with the new token.
6. Deploy the Cloudflare worker. 

The Backend API on Azure requires zero changes when the token expires; only the Cloudflare worker needs updating.
