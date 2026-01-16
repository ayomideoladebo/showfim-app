SHOWFIM MOBILE APP
OFFLINE DOWNLOAD + PLAYBACK IMPLEMENTATION PLAN
1. TECH STACK DECISION
Core
React Native (TypeScript)
Expo Bare workflow recommended
Tailwind (NativeWind)
Supabase for auth + metadata
Existing movie API for streams
Native Libraries
react-native-fs OR expo-file-system
react-native-video (ExoPlayer)
@react-native-async-storage/async-storage
expo-network or @react-native-community/netinfo
2. STORAGE STRATEGY (CRITICAL)
Target Storage
Use App-Specific Storage (Android)
Path example:
Copy code

/Android/data/com.showfim.app/files/movies/
Why:
No Chrome
No system download manager
No extra permissions
Files persist offline
Auto cleaned on uninstall
3. DOWNLOAD FLOW ARCHITECTURE
Step-by-step Download Flow
User taps Download
App requests MP4 or MKV link from API
App starts background download
Show download progress in UI
Save file to app folder
Store metadata locally
Movie appears in Downloads tab
Available offline
4. DOWNLOAD IMPLEMENTATION
File Naming Strategy
Copy code

movieId_resolution.mp4
example:
tt4154796_1080p.mp4
Download Logic
Use streaming URL directly
Download in chunks
Handle pause, resume, cancel
Track progress per file
Required Metadata to Save
Store locally using AsyncStorage or SQLite:
movieId
title
posterUrl
localFilePath
fileSize
resolution
downloadDate
status (downloading, completed, failed)
5. OFFLINE DETECTION SYSTEM
Network Awareness
Detect online or offline state
Disable streaming when offline
Enable only downloaded content
Logic:
If offline:
Hide stream buttons
Show Downloads screen only
If online:
Full functionality
6. DOWNLOADS SCREEN (UI LOGIC)
Tabs
Streaming
Downloads
Downloads Screen Displays:
Movie poster
Title
Resolution
File size
Play button
Delete option
Actions
Tap Play → plays local file
Delete → removes file + metadata
7. OFFLINE PLAYBACK IMPLEMENTATION
Video Player
Use react-native-video
Source Handling
Online:
Source = API stream URL
Offline:
Source = local file path
Example logic:
Copy code

if (isOffline && isDownloaded) {
  source = localFilePath
} else {
  source = streamUrl
}
8. STORAGE MANAGEMENT
User Controls
View total storage used
Delete individual movies
Clear all downloads
App Logic
Prevent duplicate downloads
Check available space before download
Warn user for large files
9. BACKGROUND & EDGE CASES
Handle:
App closed during download
Phone locked
Network loss mid-download
Partial files cleanup
Resume on reconnect
Strategy:
Save download state periodically
On app reopen:
Resume or restart download
Remove corrupted files
10. SECURITY CONSIDERATIONS (REALISTIC)
What you can do:
Store files in app-only directory
Obfuscate file names
Prevent media scanner indexing
What you cannot fully prevent:
Advanced users extracting files
This is acceptable and standard.