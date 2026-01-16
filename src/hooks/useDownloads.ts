
import { useEffect, useState } from 'react';
import { downloadManager, DownloadItem } from '../services/DownloadManager';

export function useDownloads() {
    const [downloads, setDownloads] = useState<DownloadItem[]>(downloadManager.getDownloads());

    useEffect(() => {
        // Subscribe to manager updates
        const unsubscribe = downloadManager.subscribe((updatedDownloads) => {
            setDownloads([...updatedDownloads]); // Create new array ref to trigger render
        });
        return unsubscribe;
    }, []);

    const startDownload = (
        item: Omit<DownloadItem, 'status' | 'progress' | 'date' | 'uri' | 'resumeData'>
    ) => {
        downloadManager.startDownload(item);
    };

    const deleteDownload = (id: string) => {
        downloadManager.deleteDownload(id);
    };

    const pauseDownload = (id: string) => {
        downloadManager.pauseDownload(id);
    };

    const resumeDownload = (id: string) => {
        downloadManager.resumeDownload(id);
    };

    const clearAllDownloads = () => {
        downloadManager.clearAll();
    };

    const isDownloaded = (contentId: string) => {
        return downloads.some(d => d.contentId === contentId && d.status === 'completed');
    };

    const getDownloadStatus = (contentId: string) => {
        return downloads.find(d => d.contentId === contentId);
    };

    return {
        downloads,
        startDownload,
        deleteDownload,
        pauseDownload,
        resumeDownload,
        clearAllDownloads,
        isDownloaded,
        getDownloadStatus
    };
}
