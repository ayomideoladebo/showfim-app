import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'showfim_search_history_v1';
const MAX_HISTORY_LENGTH = 5;

export function useSearchHistory() {
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load search history', error);
        }
    };

    const addSearchTerm = async (term: string) => {
        const trimmedTerm = term.trim();
        if (!trimmedTerm) return;

        try {
            setHistory(prev => {
                // Remove existing instance of the term to move it to the front
                const filtered = prev.filter(t => t.toLowerCase() !== trimmedTerm.toLowerCase());
                const updated = [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_LENGTH);

                // Persist
                AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)).catch(e =>
                    console.error('Failed to save search history', e)
                );

                return updated;
            });
        } catch (error) {
            console.error('Error adding search term', error);
        }
    };

    const removeSearchTerm = async (term: string) => {
        try {
            setHistory(prev => {
                const updated = prev.filter(t => t !== term);
                AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)).catch(e =>
                    console.error('Failed to update search history', e)
                );
                return updated;
            });
        } catch (error) {
            console.error('Error removing search term', error);
        }
    }

    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
            setHistory([]);
        } catch (error) {
            console.error('Failed to clear search history', error);
        }
    };

    return {
        history,
        addSearchTerm,
        removeSearchTerm,
        clearHistory
    };
}
