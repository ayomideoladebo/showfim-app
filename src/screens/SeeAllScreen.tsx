import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPosterUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';
import { CustomMovie } from '../services/customMovies';

const { width } = Dimensions.get('window');
const COLS = 3;
const CARD_W = (width - 48 - 16) / COLS;

export type SeeAllItem = TMDBMovie | TMDBTVShow | CustomMovie;

export type SeeAllSection =
    | 'trending_movies'
    | 'popular_movies'
    | 'top_rated'
    | 'upcoming'
    | 'trending_tv'
    | 'popular_tv'
    | 'k_dramas'
    | 'action'
    | 'comedy'
    | 'drama'
    | 'nollywood';

interface SeeAllScreenProps {
    section: SeeAllSection;
    title: string;
    items: SeeAllItem[];
    onBack: () => void;
    onMoviePress?: (id: number) => void;
    onTvPress?: (id: number) => void;
    onCustomMoviePress?: (id: number) => void;
}

function isCustomMovie(item: SeeAllItem): item is CustomMovie {
    return 'watch_link' in item || 'content_type' in item;
}

function isTVShow(item: SeeAllItem): item is TMDBTVShow {
    return 'name' in item && !('watch_link' in item);
}

function getTitle(item: SeeAllItem): string {
    if (isCustomMovie(item)) return item.title;
    if (isTVShow(item)) return item.name;
    return (item as TMDBMovie).title;
}

function getPoster(item: SeeAllItem): string | null {
    if (isCustomMovie(item)) return item.poster_url;
    return getPosterUrl((item as TMDBMovie | TMDBTVShow).poster_path);
}

function getRating(item: SeeAllItem): number {
    if (isCustomMovie(item)) return 0;
    return (item as TMDBMovie | TMDBTVShow).vote_average || 0;
}

export default function SeeAllScreen({
    title, items, onBack, onMoviePress, onTvPress, onCustomMoviePress,
}: SeeAllScreenProps) {
    const handlePress = (item: SeeAllItem) => {
        if (isCustomMovie(item)) {
            onCustomMoviePress?.(item.id);
        } else if (isTVShow(item)) {
            onTvPress?.((item as TMDBTVShow).id);
        } else {
            onMoviePress?.((item as TMDBMovie).id);
        }
    };

    const renderItem = ({ item }: { item: SeeAllItem }) => {
        const poster = getPoster(item);
        const label = getTitle(item);
        const rating = getRating(item);

        return (
            <TouchableOpacity style={[styles.card, { width: CARD_W }]} onPress={() => handlePress(item)} activeOpacity={0.8}>
                {poster ? (
                    <Image source={{ uri: poster }} style={styles.poster} />
                ) : (
                    <View style={[styles.poster, styles.posterPlaceholder]}>
                        <MaterialIcons name="movie" size={28} color="#4b5563" />
                    </View>
                )}
                {rating > 0 && (
                    <View style={styles.ratingBadge}>
                        <MaterialIcons name="star" size={10} color="#FFC107" />
                        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                )}
                {isCustomMovie(item) && (
                    <View style={styles.nollyBadge}>
                        <Text style={styles.nollyText}>NG</Text>
                    </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.countText}>{items.length}</Text>
                </SafeAreaView>
            </View>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <ActivityIndicator size="large" color="#9727e7" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item, idx) => `${isCustomMovie(item) ? 'custom' : isTVShow(item) ? 'tv' : 'movie'}_${item.id}_${idx}`}
                    renderItem={renderItem}
                    numColumns={COLS}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={styles.row}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1121' },
    header: {
        backgroundColor: 'rgba(26,17,33,0.97)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerContent: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    headerTitle: { fontSize: 18, color: 'white', fontFamily: 'Manrope_700Bold', flex: 1, textAlign: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    countText: { color: '#6b7280', fontSize: 14, fontFamily: 'Manrope_500Medium', width: 40, textAlign: 'right' },

    grid: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 40 },
    row: { gap: 8, marginBottom: 16 },

    card: { alignItems: 'center', position: 'relative' },
    poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: '#2d2434' },
    posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    cardTitle: {
        color: '#9ca3af', fontSize: 11, fontFamily: 'Manrope_500Medium',
        marginTop: 6, textAlign: 'center', paddingHorizontal: 4,
    },
    ratingBadge: {
        position: 'absolute', top: 6, left: 6,
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6,
        paddingHorizontal: 5, paddingVertical: 3,
    },
    ratingText: { color: 'white', fontSize: 9, fontFamily: 'Manrope_600SemiBold' },
    nollyBadge: {
        position: 'absolute', top: 6, right: 6,
        backgroundColor: '#9727e7', borderRadius: 6,
        paddingHorizontal: 5, paddingVertical: 2,
    },
    nollyText: { color: 'white', fontSize: 8, fontFamily: 'Manrope_700Bold' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
