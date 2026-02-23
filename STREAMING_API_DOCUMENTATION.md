# Showfim Streaming & Download API Implementation

## Overview
This document details the streaming and download system implementation for movies and TV shows, including API structure, data parsing, platform prioritization, and exclusion logic.

---

## API Configuration

### Base URL
```
https://showfim-api-cnetghdfc6e5f4df.southindia-01.azurewebsites.net
```

### Endpoints
| Content Type | Endpoint Pattern |
|--------------|------------------|
| Movies | `/api/download/movie/{tmdb_id}` |
| TV Shows | `/api/download/tv/{tmdb_id}/{season}/{episode}` |
| Proxy Stream | `/api/proxy/stream?url={url}` |
| Proxy Download | `/api/proxy/download?url={url}&filename={name}` |
| Proxy Subtitle | `/api/proxy/subtitle?url={url}` |

### Example Requests
```
Movie:    https://showfim-api-cnetghdfc6e5f4df.southindia-01.azurewebsites.net/api/download/movie/1584215
TV Show:  https://showfim-api-cnetghdfc6e5f4df.southindia-01.azurewebsites.net/api/download/tv/12345/1/5
```

---

## API Response Structure

### Full Response Schema
```json
{
  "data": {
    "downloadData": {
      "data": {
        "downloads": [...],
        "captions": [...],
        "hasResource": true
      }
    }
  },
  "externalStreams": [...]
}
```

### Downloads Array
```typescript
interface Download {
  id: string;
  url: string;
  quality: string;      // e.g., "720", "1080"
  size: string;         // e.g., "1.2GB"
}
```

### Captions (Subtitles) Array
```typescript
interface Caption {
  id?: string;
  lan: string;          // Language code, e.g., "en"
  lanName: string;      // Language name, e.g., "English"
  url: string;          // Direct subtitle URL (SRT/VTT)
  size?: number;
  delay?: number;
}
```

### External Streams Array
```typescript
interface ExternalStream {
  name: string;         // Provider name, e.g., "FzMovies", "DahmerMovies"
  title: string;        // Stream title
  url: string;          // Direct video URL (MP4)
  quality: string;      // Resolution, e.g., "720", "1080"
  size: string | null;  // File size
  type: string;         // File type, e.g., "mp4"
  filename?: string;    // Original filename
}
```

---

## Hooks Implementation

### 1. useMovieStreams Hook
**File:** `src/hooks/useMovieStreams.ts`

```typescript
import { MOVIEBOX_API_BASE } from "../utils/streamUtils";

export function useMovieStreams(movieId: string | number) {
  // Fetches from: ${MOVIEBOX_API_BASE}/api/download/movie/${movieId}
  // Returns: { streams, loading, error, hasFetched, refetch }
}
```

**Data Parsing Logic:**
```typescript
// Handle nested response structure
const downloadData = data.data?.downloadData?.data || data.downloadData?.data || data.data || data;

// Process components to use proxy
const parsedStreams = {
  downloads: downloadData.downloads || [],
  captions: downloadData.captions.map(c => ({...c, url: getProxiedSubtitleUrl(c.url)})),
  externalStreams: data.externalStreams || [],
  hasResource: downloadData.hasResource ?? true,
};
```

### 2. useTVShowStreams Hook
**File:** `src/hooks/useTVShowStreams.ts`

```typescript
export const useTVShowStreams = (showId: string | number, season: number, episode: number) => {
  // Fetches from: ${API_BASE}/tv/${showId}/${season}/${episode}
  // Returns: { streams, loading, error, hasFetched, refetch }
}
```

---

## External Streams Processing

### Platform Exclusions
**Excluded:** `DahmerMovies`  
**Reason:** Poor quality, unreliable sources, inappropriate content branding

```typescript
streams.externalStreams.filter(s => s.name !== "DahmerMovies")
```

### Platform Prioritization
**Prioritized:** `FzMovies`  
**Reason:** Best quality, most reliable, consistent file naming

```typescript
.sort((a, b) => {
  if (a.name === "FzMovies" && b.name !== "FzMovies") return -1;
  if (a.name !== "FzMovies" && b.name === "FzMovies") return 1;
  return 0;
})
```

### Quality Deduplication
Only keep one source per resolution to avoid duplicates:

```typescript
.reduce((acc, s) => {
  const resolution = parseInt(s.quality) || 720;
  if (!acc.find(item => item.resolution === resolution)) {
    acc.push({
      id: `${s.name}-${s.quality}-${acc.length}`,
      url: s.url,
      resolution: resolution,
      size: s.size || '0'
    });
  }
  return acc;
}, [] as any[])
```

---

## Download Modal Implementation

### MovieDownloadModal
**File:** `src/components/MovieDownloadModal.tsx`

**Features:**
- Displays available download qualities
- Shows file sizes with badges
- Excludes DahmerMovies sources
- Provides subtitle downloads
- Fallback download URL option

### TVShowDownloadModal
**File:** `src/components/TVShowDownloadModal.tsx`

**Similar to MovieDownloadModal but includes:**
- Episode-specific information
- Season/Episode display

### Download Flow
1. User clicks "Download Movie/Episode"
2. Modal opens with quality options
3. External streams filtered (exclude DahmerMovies)
4. Sorted by resolution (highest first)
5. User selects quality → Direct download link opens

---

## Streaming Player Integration

### MoviePlayer Component
**File:** `src/components/player/MoviePlayer.tsx`

**Props:**
```typescript
interface MoviePlayerProps {
  sources: MovieDownload[];      // Processed external streams
  subtitles?: MovieCaption[];    // Captions array
  title?: string;
  autoPlay?: boolean;
  contentId?: string;            // For resume playback
}
```

### Stream Source Processing in Detail Pages

**MovieDetail.tsx:**
```typescript
<MoviePlayer 
  sources={streams.externalStreams
    .filter(s => s.name !== "DahmerMovies")      // EXCLUDE
    .sort((a, b) => {                             // PRIORITIZE
      if (a.name === "FzMovies" && b.name !== "FzMovies") return -1;
      if (a.name !== "FzMovies" && b.name === "FzMovies") return 1;
      return 0;
    })
    .reduce(/* deduplication logic */)
  }
  subtitles={streams.captions}
  title={movie.title}
  autoPlay={true}
  contentId={`movie-${id}`}
/>
```

---

## Fallback System

When external streams are unavailable, the system falls back to embed players:

```typescript
{(streamsLoading || !hasFetched) ? (
  // Show loading animation
) : streams && streams.externalStreams.filter(s => s.name !== "DahmerMovies").length > 0 ? (
  // Show MoviePlayer with external streams
) : (
  // Show fallback iframe embed
  <iframe src={`https://vidfast.pro/movie/${id}?autoPlay=true&theme=9B59B6&hideServer=true`} />
)}
```

**Fallback URLs:**
- Movies: `https://vidfast.pro/movie/{id}`
- TV Shows: `https://vidfast.pro/tv/{id}/{season}/{episode}`

---

## Subtitle System

### CORS Proxy Solution
Subtitles from the API have CORS restrictions. We proxy them through Supabase Edge Function:

**Edge Function:** `supabase/functions/subtitle-proxy/index.ts`

```typescript
// Request: /functions/v1/subtitle-proxy?url={encoded_subtitle_url}
// Response: Subtitle content (SRT/VTT)
```

### SRT to VTT Conversion
The player automatically converts SRT format to VTT:

```typescript
if (subtitle.url.includes('.srt') && !subtitleText.startsWith('WEBVTT')) {
  subtitleText = 'WEBVTT\n\n' + subtitleText
    .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4');
}
```

---

## Resume Playback Feature

### Storage Key
```typescript
const PROGRESS_STORAGE_KEY = "showfim_playback_progress";
```

### Content ID Format
| Type | Format |
|------|--------|
| Movie | `movie-{tmdb_id}` |
| TV Episode | `tv-{tmdb_id}-{season}-{episode}` |

### Progress Data Structure
```typescript
{
  "movie-1584215": {
    "time": 1923.5,      // Current playback position
    "duration": 5400,    // Total video duration
    "updatedAt": 1705400000000
  }
}
```

---

## Summary

| Feature | Implementation |
|---------|----------------|
| **API Base** | `https://showfim-api-cnetghdfc6e5f4df...southindia-01.azurewebsites.net` |
| **Excluded Source** | `DahmerMovies` (applied to external streams fallback) |
| **Proxy System** | Native Azure Proxy Endpoints (`/api/proxy/*`) |
| **Subtitle Proxy** | Integrated Azure Proxy |
| **Download Flow** | Chunked Server Proxying with proper headers |
| **Fallback Player** | vidfast.pro embed |
