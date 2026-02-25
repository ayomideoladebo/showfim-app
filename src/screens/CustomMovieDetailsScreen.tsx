import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getCustomMovies, getCustomEpisodes, CustomMovie, CustomEpisode } from '../services/customMovies';
import ShowfimPlayer from '../components/player/ShowfimPlayer';
import DownloadModal from '../components/DownloadModal';

const { width } = Dimensions.get('window');

interface Props {
    movieId: number;
    onBack: () => void;
}

export default function CustomMovieDetailsScreen({ movieId, onBack }: Props) {
    const [movie, setMovie] = useState<CustomMovie | null>(null);
    const [episodes, setEpisodes] = useState<CustomEpisode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPlayer, setShowPlayer] = useState(false);
    const [playerSource, setPlayerSource] = useState<{ url: string; title: string; contentId: string } | null>(null);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadSources, setDownloadSources] = useState<any[]>([]);
    const [downloadTitle, setDownloadTitle] = useState('');
    const [downloadContentId, setDownloadContentId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeSeason, setActiveSeason] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const movies = await getCustomMovies();
                const found = movies.find(m => m.id === movieId);
                if (!found) { setError('Not found'); return; }
                setMovie(found);
                if (found.content_type === 'tv') {
                    const eps = await getCustomEpisodes(found.id);
                    setEpisodes(eps);
                    if (eps.length > 0) setActiveSeason(eps[0].season_number);
                }
            } catch {
                setError('Failed to load details');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [movieId]);

    // Group episodes by season
    const seasons = useMemo(() => {
        const map: Record<number, CustomEpisode[]> = {};
        for (const ep of episodes) {
            if (!map[ep.season_number]) map[ep.season_number] = [];
            map[ep.season_number].push(ep);
        }
        return map;
    }, [episodes]);

    const seasonNumbers = Object.keys(seasons).map(Number).sort((a, b) => a - b);

    const playEpisode = (ep: CustomEpisode) => {
        if (!ep.stream_url) return;
        setPlayerSource({
            url: ep.stream_url,
            title: `${movie?.title} S${ep.season_number}E${ep.episode_number} – ${ep.title}`,
            contentId: `custom_ep_${ep.id}`,
        });
        setShowPlayer(true);
    };

    const playMovie = () => {
        if (!movie?.watch_link) return;
        setPlayerSource({
            url: movie.watch_link,
            title: movie.title,
            contentId: `custom_${movie.id}`,
        });
        setShowPlayer(true);
    };

    const openDownload = (url: string, title: string, id: string) => {
        setDownloadSources([{
            id,
            name: 'Original',
            url,
            downloadUrl: url,
            quality: '720p',
            resolution: 720,
            size: 'Unknown',
        }]);
        setDownloadTitle(title);
        setDownloadContentId(id);
        setShowDownloadModal(true);
    };

    // ─── Player ────────────────────────────────────────────────────────────────
    if (showPlayer && playerSource) {
        return (
            <View style={StyleSheet.absoluteFillObject}>
                <ShowfimPlayer
                    sources={[{
                        id: playerSource.contentId,
                        name: 'Original',
                        url: playerSource.url,
                        quality: '720p',
                        resolution: 720,
                        size: 'Unknown',
                    }]}
                    title={playerSource.title}
                    contentId={playerSource.contentId}
                    poster={movie?.poster_url || undefined}
                    autoPlay={true}
                    onClose={() => setShowPlayer(false)}
                />
            </View>
        );
    }

    // ─── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#9727e7" />
            </View>
        );
    }

    // ─── Error ─────────────────────────────────────────────────────────────────
    if (error || !movie) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
                <TouchableOpacity style={styles.backButtonTop} onPress={onBack}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    const isTV = movie.content_type === 'tv';
    const currentEpisodes = seasons[activeSeason] || [];

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ScrollView bounces={false}>

                {/* ── Header / Poster ── */}
                <View style={styles.headerImageContainer}>
                    <Image
                        source={{ uri: movie.poster_url || undefined }}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', '#1a1121']}
                        style={styles.headerGradient}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <View style={styles.backIconContainer}>
                            <MaterialIcons name="arrow-back" size={24} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Content ── */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{movie.title}</Text>

                    <View style={styles.metaInfo}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{isTV ? 'TV Series' : 'Movie'}</Text>
                        </View>
                        {movie.release_date && (
                            <>
                                <View style={styles.dot} />
                                <Text style={styles.metaText}>{new Date(movie.release_date).getFullYear()}</Text>
                            </>
                        )}
                        {isTV && movie.season_count && (
                            <>
                                <View style={styles.dot} />
                                <Text style={styles.metaText}>{movie.season_count} Season{movie.season_count > 1 ? 's' : ''}</Text>
                            </>
                        )}
                        <View style={styles.dot} />
                        <Text style={styles.metaText}>HD</Text>
                    </View>

                    {/* ── Action Row ── */}
                    {!isTV && (
                        <View style={styles.actionRow}>
                            {movie.watch_link ? (
                                <TouchableOpacity style={styles.playButton} onPress={playMovie}>
                                    <MaterialIcons name="play-arrow" size={28} color="white" />
                                    <Text style={styles.playText}>Play</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.playButton, { opacity: 0.5 }]}>
                                    <Text style={styles.playText}>Not Available</Text>
                                </View>
                            )}
                            {movie.download_link && (
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => openDownload(movie.download_link!, movie.title, `custom_${movie.id}`)}
                                >
                                    <MaterialIcons name="file-download" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.iconButton}>
                                <MaterialIcons name="add" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {movie.overview ? (
                        <Text style={styles.overview}>{movie.overview}</Text>
                    ) : null}

                    {/* ── Episodes (TV only) ── */}
                    {isTV && (
                        <View style={styles.episodesSection}>
                            <Text style={styles.sectionLabel}>Episodes</Text>

                            {/* Season Tabs */}
                            {seasonNumbers.length > 1 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonTabs}>
                                    {seasonNumbers.map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.seasonTab, activeSeason === s && styles.seasonTabActive]}
                                            onPress={() => setActiveSeason(s)}
                                        >
                                            <Text style={[styles.seasonTabText, activeSeason === s && styles.seasonTabTextActive]}>
                                                Season {s}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {/* Episode List */}
                            {currentEpisodes.length === 0 ? (
                                <Text style={styles.noEpisodesText}>No episodes available</Text>
                            ) : (
                                currentEpisodes.map((ep) => (
                                    <View key={ep.id} style={styles.episodeCard}>
                                        {/* Thumbnail */}
                                        <TouchableOpacity style={styles.episodeThumbnailWrapper} onPress={() => playEpisode(ep)}>
                                            {ep.still_url ? (
                                                <Image source={{ uri: ep.still_url }} style={styles.episodeThumbnail} resizeMode="cover" />
                                            ) : (
                                                <View style={[styles.episodeThumbnail, styles.episodeThumbnailPlaceholder]}>
                                                    <MaterialIcons name="movie" size={32} color="#6b7280" />
                                                </View>
                                            )}
                                            {ep.stream_url && (
                                                <View style={styles.playOverlay}>
                                                    <MaterialIcons name="play-circle-filled" size={36} color="rgba(255,255,255,0.9)" />
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* Info */}
                                        <View style={styles.episodeInfo}>
                                            <Text style={styles.episodeNumber}>E{ep.episode_number}</Text>
                                            <Text style={styles.episodeTitle} numberOfLines={2}>{ep.title}</Text>
                                            {ep.overview ? (
                                                <Text style={styles.episodeOverview} numberOfLines={2}>{ep.overview}</Text>
                                            ) : null}
                                            {/* Download button */}
                                            {ep.download_url && (
                                                <TouchableOpacity
                                                    style={styles.epDownloadBtn}
                                                    onPress={() => openDownload(
                                                        ep.download_url!,
                                                        `${movie.title} S${ep.season_number}E${ep.episode_number}`,
                                                        `custom_ep_${ep.id}`
                                                    )}
                                                >
                                                    <MaterialIcons name="file-download" size={18} color="#9727e7" />
                                                    <Text style={styles.epDownloadText}>Download</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <DownloadModal
                visible={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                contentId={downloadContentId}
                title={downloadTitle}
                posterUrl={movie.poster_url || ''}
                type={isTV ? 'tv' : 'movie'}
                sources={downloadSources}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1121' },
    center: { flex: 1, backgroundColor: '#1a1121', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 18, fontFamily: 'Manrope_600SemiBold' },
    backButtonTop: {
        position: 'absolute', top: 40, left: 20, padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    },
    headerImageContainer: { width, height: width * 1.4, maxHeight: 560, position: 'relative' },
    headerImage: { width: '100%', height: '100%' },
    headerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    backIconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
    },
    contentContainer: { padding: 24, paddingTop: 0 },
    title: { fontSize: 30, color: 'white', fontFamily: 'Manrope_800ExtraBold', marginBottom: 8 },
    metaInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 4 },
    badge: {
        backgroundColor: 'rgba(151,39,231,0.2)', borderRadius: 4,
        paddingHorizontal: 8, paddingVertical: 2,
        borderWidth: 1, borderColor: '#9727e7',
    },
    badgeText: { color: '#9727e7', fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
    metaText: { color: '#9ca3af', fontSize: 14, fontFamily: 'Manrope_500Medium' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#9ca3af', marginHorizontal: 6 },
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    playButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#9727e7', borderRadius: 24, height: 48, gap: 8,
    },
    playText: { color: 'white', fontSize: 16, fontFamily: 'Manrope_700Bold' },
    iconButton: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#2d2434', justifyContent: 'center', alignItems: 'center',
    },
    overview: { color: '#d1d5db', fontSize: 15, fontFamily: 'Manrope_400Regular', lineHeight: 23, marginBottom: 24 },

    episodesSection: { marginTop: 8 },
    sectionLabel: { fontSize: 20, color: 'white', fontFamily: 'Manrope_700Bold', marginBottom: 16 },
    seasonTabs: { marginBottom: 16 },
    seasonTab: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#2d2434', marginRight: 10,
        borderWidth: 1, borderColor: 'transparent',
    },
    seasonTabActive: { borderColor: '#9727e7', backgroundColor: 'rgba(151,39,231,0.15)' },
    seasonTabText: { color: '#9ca3af', fontSize: 14, fontFamily: 'Manrope_600SemiBold' },
    seasonTabTextActive: { color: '#9727e7' },
    noEpisodesText: { color: '#6b7280', fontSize: 14, fontFamily: 'Manrope_500Medium', paddingVertical: 20 },

    episodeCard: {
        flexDirection: 'row', backgroundColor: '#231830', borderRadius: 12,
        marginBottom: 14, overflow: 'hidden',
    },
    episodeThumbnailWrapper: { position: 'relative' },
    episodeThumbnail: { width: 120, height: 80 },
    episodeThumbnailPlaceholder: { backgroundColor: '#2d2434', justifyContent: 'center', alignItems: 'center' },
    playOverlay: {
        position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    episodeInfo: { flex: 1, padding: 10, justifyContent: 'center' },
    episodeNumber: { color: '#9727e7', fontSize: 12, fontFamily: 'Manrope_600SemiBold', marginBottom: 2 },
    episodeTitle: { color: 'white', fontSize: 14, fontFamily: 'Manrope_600SemiBold', marginBottom: 4 },
    episodeOverview: { color: '#9ca3af', fontSize: 12, fontFamily: 'Manrope_400Regular', lineHeight: 17 },
    epDownloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    epDownloadText: { color: '#9727e7', fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
});
