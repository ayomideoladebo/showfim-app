import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDownloads } from '../hooks/useDownloads';
import { getTrendingMovies, getTrendingTV, getPosterUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';

const READ_KEY = 'showfim_notifications_read';

interface NotificationsScreenProps {
  onBack: () => void;
  onMoviePress?: (movieId: number) => void;
  onTvPress?: (tvId: number) => void;
}

type NotifType = 'download_complete' | 'download_failed' | 'recommendation';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  posterUrl?: string;
  timestamp: Date;
  actionId?: number;   // movieId or tvId
  actionKind?: 'movie' | 'tv';
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen({ onBack, onMoviePress, onTvPress }: NotificationsScreenProps): React.ReactElement {
  const { downloads } = useDownloads();
  const [recommendations, setRecommendations] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load saved read state
  useEffect(() => {
    AsyncStorage.getItem(READ_KEY).then((raw) => {
      if (raw) {
        try { setReadIds(new Set(JSON.parse(raw))); } catch { }
      }
    });
  }, []);

  const saveReadIds = (ids: Set<string>) => {
    AsyncStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  };

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const fetchRecommendations = useCallback(async () => {
    try {
      const [movies, tv] = await Promise.all([getTrendingMovies('week'), getTrendingTV('week')]);
      // Pick 3 movies + 3 TV shows randomly
      const pick = <T,>(arr: T[], n: number): T[] => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
      };
      const pickedMovies = pick(movies, 3);
      const pickedTV = pick(tv, 3);

      const recNotifs: Notification[] = [
        ...pickedMovies.map((m: TMDBMovie) => ({
          id: `rec_movie_${m.id}`,
          type: 'recommendation' as NotifType,
          title: '🎬 Recommended For You',
          description: `${m.title} is trending and highly rated (${m.vote_average?.toFixed(1)}★). Don't miss it!`,
          posterUrl: getPosterUrl(m.poster_path),
          timestamp: new Date(Date.now() - Math.random() * 3 * 86400000),
          actionId: m.id,
          actionKind: 'movie' as const,
        })),
        ...pickedTV.map((t: TMDBTVShow) => ({
          id: `rec_tv_${t.id}`,
          type: 'recommendation' as NotifType,
          title: '📺 Trending TV Show',
          description: `${t.name} is trending this week (${t.vote_average?.toFixed(1)}★). Start watching now!`,
          posterUrl: getPosterUrl(t.poster_path),
          timestamp: new Date(Date.now() - Math.random() * 7 * 86400000),
          actionId: t.id,
          actionKind: 'tv' as const,
        })),
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRecommendations(recNotifs);
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => { fetchRecommendations(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoadingRecs(true);
    await fetchRecommendations();
    setRefreshing(false);
  };

  // Build download notifications from real download history
  const downloadNotifs: Notification[] = downloads
    .filter(d => d.status === 'completed' || d.status === 'failed')
    .map(d => ({
      id: `dl_${d.id}`,
      type: d.status === 'completed' ? 'download_complete' : 'download_failed' as NotifType,
      title: d.status === 'completed' ? 'Download Complete ✓' : 'Download Failed',
      description: d.status === 'completed'
        ? `${d.title} has been downloaded successfully. Enjoy watching offline!`
        : `${d.title} could not be downloaded. Tap to retry.`,
      posterUrl: d.posterUrl,
      timestamp: new Date(d.date),
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const allNotifications = [...downloadNotifs, ...recommendations]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const newNotifs = allNotifications.filter(n => !readIds.has(n.id));
  const earlierNotifs = allNotifications.filter(n => readIds.has(n.id));

  const markAllRead = () => {
    const allIds = new Set([...readIds, ...allNotifications.map(n => n.id)]);
    setReadIds(allIds);
    saveReadIds(allIds);
  };

  const handlePress = (notif: Notification) => {
    markRead(notif.id);
    if (notif.actionId) {
      if (notif.actionKind === 'movie') onMoviePress?.(notif.actionId);
      else if (notif.actionKind === 'tv') onTvPress?.(notif.actionId);
    }
  };

  const getIcon = (type: NotifType) => {
    if (type === 'download_complete') return { name: 'check-circle' as const, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    if (type === 'download_failed') return { name: 'error' as const, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    return { name: 'thumb-up' as const, color: '#9727e7', bg: 'rgba(151,39,231,0.15)' };
  };

  const renderNotif = (notif: Notification) => {
    const isRead = readIds.has(notif.id);
    const icon = getIcon(notif.type);

    return (
      <TouchableOpacity
        key={notif.id}
        style={[styles.notificationItem, isRead && styles.readItem]}
        activeOpacity={0.7}
        onPress={() => handlePress(notif)}
      >
        {/* Left: icon or poster */}
        <View style={styles.iconWrapper}>
          {notif.posterUrl ? (
            <Image source={{ uri: notif.posterUrl }} style={styles.posterThumb} />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
              <MaterialIcons name={icon.name} size={24} color={icon.color} />
            </View>
          )}
          {!isRead && <View style={styles.unreadDot} />}
        </View>

        {/* Right: text */}
        <View style={styles.contentWrapper}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, isRead && styles.readTitle]}>{notif.title}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(notif.timestamp)}</Text>
          </View>
          <Text style={styles.itemDescription} numberOfLines={3}>{notif.description}</Text>

          {/* Poster preview for recommendations */}
          {notif.type === 'recommendation' && notif.posterUrl && (
            <View style={styles.heroImageContainer}>
              <Image source={{ uri: notif.posterUrl }} style={styles.heroImage} />
              <View style={styles.watchNowRow}>
                <MaterialIcons name="play-circle-outline" size={16} color="white" />
                <Text style={styles.watchNowText}>WATCH NOW</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={markAllRead}>
            <MaterialIcons name="done-all" size={24} color="#9727e7" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9727e7" />}
      >
        {/* NEW */}
        {newNotifs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>NEW</Text>
              <TouchableOpacity onPress={markAllRead}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {newNotifs.map(renderNotif)}
            </View>
          </>
        )}

        {/* Loading recommendations skeleton */}
        {loadingRecs && newNotifs.length === 0 && downloadNotifs.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9727e7" />
            <Text style={styles.loadingText}>Loading recommendations...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loadingRecs && allNotifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#4b5563" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>Download movies to get alerts, and pull to refresh for recommendations.</Text>
          </View>
        )}

        {/* EARLIER */}
        {earlierNotifs.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>EARLIER</Text>
            </View>
            <View style={styles.listContainer}>
              {earlierNotifs.map(renderNotif)}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1121' },
  header: {
    backgroundColor: 'rgba(26, 17, 33, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, color: 'white', fontFamily: 'Manrope_700Bold', letterSpacing: 0.5 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingTop: 20 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11, color: '#6b7280', textTransform: 'uppercase',
    letterSpacing: 2, fontFamily: 'Manrope_700Bold',
  },
  markReadText: { fontSize: 12, color: '#9727e7', fontFamily: 'Manrope_600SemiBold' },
  listContainer: { gap: 2 },

  notificationItem: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 12,
    borderRadius: 16, gap: 14, backgroundColor: 'rgba(151,39,231,0.04)',
  },
  readItem: { backgroundColor: 'transparent' },

  iconWrapper: { position: 'relative', paddingTop: 2 },
  posterThumb: { width: 48, height: 48, borderRadius: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#9727e7', borderWidth: 2, borderColor: '#1a1121',
  },

  contentWrapper: { flex: 1, paddingTop: 2 },
  itemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 4,
  },
  itemTitle: { color: 'white', fontSize: 14, fontFamily: 'Manrope_700Bold', flex: 1, marginRight: 8 },
  readTitle: { color: '#9ca3af' },
  timestamp: { fontSize: 10, color: '#6b7280', fontFamily: 'Manrope_500Medium' },
  itemDescription: { color: '#9ca3af', fontSize: 12, lineHeight: 18, paddingRight: 4, marginBottom: 4 },

  heroImageContainer: {
    marginTop: 10, width: '100%', aspectRatio: 21 / 9,
    borderRadius: 10, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  watchNowRow: {
    position: 'absolute', bottom: 8, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  watchNowText: {
    color: 'white', fontSize: 10, fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase', letterSpacing: 1,
  },

  loadingContainer: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14, fontFamily: 'Manrope_500Medium' },
  emptyContainer: { paddingVertical: 80, alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { color: '#d1d5db', fontSize: 18, fontFamily: 'Manrope_700Bold' },
  emptySubtitle: { color: '#6b7280', fontSize: 14, fontFamily: 'Manrope_500Medium', textAlign: 'center', lineHeight: 20 },
});
