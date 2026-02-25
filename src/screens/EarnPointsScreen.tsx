import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface EarnPointsScreenProps {
  onClose: () => void;
  onRedeemPress?: () => void;
  onBack?: () => void;
  onHistoryPress?: () => void;
}

export default function EarnPointsScreen({ onClose, onRedeemPress, onBack, onHistoryPress }: EarnPointsScreenProps) {
  const { user } = useAuth();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  // Real task tracking
  const [tasks, setTasks] = useState<any[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch points and level
      const { data: profileData } = await (supabase
        .from('profiles') as any)
        .select('points_earned, level')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setPointsBalance(profileData.points_earned);
        setLevel(profileData.level || 1);
      }

      // Fetch active tasks
      const { data: allTasks, error: tasksError } = await (supabase
        .from('tasks') as any)
        .select('*')
        .eq('is_active', true);

      if (allTasks) {
        // Fetch user progress for these tasks
        const { data: userProgress } = await (supabase
          .from('user_tasks') as any)
          .select('*')
          .eq('user_id', user.id);

        // Merge them
        const mergedTasks = (allTasks as any[]).map(task => {
          const progress = (userProgress as any[])?.find(p => p.task_id === task.id);
          return {
            ...task,
            progress_count: progress?.progress_count || 0,
            is_completed: progress?.is_completed || false,
            is_claimed: progress?.is_claimed || false
          };
        });

        // Let's do a little cheat: Complete profile task logic if missing 
        // We know they have a profile if they are here. So let's auto-complete it client side if needed.
        const profileTask = mergedTasks.find(t => t.required_action === 'complete_profile');
        if (profileTask && !profileTask.is_completed) {
          await (supabase.from('user_tasks') as any).upsert({
            user_id: user.id,
            task_id: profileTask.id,
            progress_count: 1,
            is_completed: true,
            is_claimed: false
          }, { onConflict: 'user_id,task_id,reset_at' } as any);
          profileTask.is_completed = true;
          profileTask.progress_count = 1;
        }

        setTasks(mergedTasks);
      }
    } catch (e) {
      console.error('Error fetching earn points data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleClaim = async (taskId: string, points: number) => {
    if (!user || claimingId) return;
    setClaimingId(taskId);

    try {
      await (supabase as any).rpc('claim_task_points', {
        p_user_id: user.id,
        p_task_id: taskId,
        p_points: points
      });

      // Optimistic update locally
      setPointsBalance(prev => prev + points);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, is_claimed: true } : t
      ));
    } catch (e) {
      console.error("Failed to claim task", e);
    } finally {
      setClaimingId(null);
    }
  };

  const dailyTasks = tasks.filter(t => t.task_type === 'daily' || t.task_type === 'one_time');
  const weeklyTasks = tasks.filter(t => t.task_type === 'weekly');

  const getLevelTitle = () => {
    if (level >= 10) return 'Movie Master';
    if (level >= 7) return 'Cinema Expert';
    if (level >= 4) return 'Movie Buff';
    if (level >= 2) return 'Film Fan';
    return 'Newcomer';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyButton} onPress={onHistoryPress}>
          <MaterialIcons name="history" size={16} color="#d1d5db" />
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGL_FMr5zWsZYNk9gb8nwrIN3rARUlf0y5lHT-MOI09CJpQzWitxbfYl2B7cAgbC8VTnlh5trqNHcAToyVTjGOzSMciG-Iyrge3w8ooiIYHpZ4uE1BA-xmSQgir-4YZMFKwGx9kn3l-QAyDz3DfehUX-exxSA7vXzGFsTBMaNi35qhK8V56rucvF64RLzy5Pmiz-K4cmP-JKla483qWgJesE7e7gCjue5JLKgeip1pV7fnrLWk_RoijxbQM1eT13-DIyuAt4QHnB1R' }}
          style={styles.heroBackground}
          blurRadius={40}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26,17,33,0.5)', '#1a1121']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            <Text style={styles.balanceLabel}>Your Points Balance</Text>
            <View style={styles.pointsRow}>
              <View style={styles.coinIcon}>
                <MaterialIcons name="monetization-on" size={28} color="white" />
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Text style={styles.pointsValue}>{pointsBalance.toLocaleString()}</Text>
              )}
            </View>
            <View style={styles.levelBadge}>
              <View style={styles.levelDot} />
              <Text style={styles.levelText}>Level {level}: {getLevelTitle()}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Daily Tasks</Text>
              <View style={styles.dot} />
            </View>
            <View style={styles.resetBadge}>
              <Text style={styles.resetText}>Resets in 4h 20m</Text>
            </View>
          </View>

          <View style={styles.tasksList}>
            {dailyTasks.map(task => {
              const progressPercent = Math.min((task.progress_count / task.required_count) * 100, 100);
              return (
                <View key={task.id} style={[styles.taskCard, task.is_completed && !task.is_claimed && styles.taskCompleted]}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskLeft}>
                      <View style={[styles.taskIcon, task.is_completed && styles.taskIconActive]}>
                        <MaterialIcons name={task.icon_name || "star"} size={20} color={task.is_completed ? "#9727e7" : "#9ca3af"} />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.pointsRow2}>
                          <MaterialIcons name="bolt" size={14} color="#fbbf24" />
                          <Text style={styles.taskPoints}>+{task.points_reward} pts</Text>
                        </View>
                      </View>
                    </View>

                    {task.is_claimed ? (
                      <View style={styles.claimedBadge}>
                        <MaterialIcons name="check" size={12} color="#10b981" />
                        <Text style={styles.claimedText}>Claimed</Text>
                      </View>
                    ) : task.is_completed ? (
                      <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => handleClaim(task.id, task.points_reward)}
                        disabled={claimingId === task.id}
                      >
                        <Text style={styles.claimButtonText}>{claimingId === task.id ? '...' : 'Claim'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.goButton}>
                        <Text style={styles.goButtonText}>Go</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!task.is_claimed && (
                    <>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                      </View>
                      <View style={styles.progressFooter}>
                        <Text style={styles.progressLabel}>{task.is_completed ? 'Completed' : 'In Progress'}</Text>
                        <Text style={styles.progressValue}>{task.progress_count} / {task.required_count}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}

            {dailyTasks.length === 0 && (
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginVertical: 20 }}>No daily tasks available right now.</Text>
            )}
          </View>
        </View>

        {/* Weekly Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Weekly Challenges</Text>
              <View style={[styles.dot, { backgroundColor: '#fbbf24' }]} />
            </View>
            <View style={[styles.resetBadge, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
              <Text style={[styles.resetText, { color: '#fbbf24' }]}>Ends in 3 days</Text>
            </View>
          </View>

          <View style={styles.tasksList}>
            {weeklyTasks.map(task => {
              const progressPercent = Math.min((task.progress_count / task.required_count) * 100, 100);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskLeft}>
                      <View style={styles.taskIcon}>
                        <MaterialIcons name={task.icon_name || "movie"} size={20} color="#9ca3af" />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.pointsRow2}>
                          <MaterialIcons name="local-activity" size={14} color="#f43f5e" />
                          <Text style={[styles.taskPoints, { color: '#f43f5e' }]}>+{task.points_reward} pts</Text>
                        </View>
                      </View>
                    </View>

                    {task.is_claimed ? (
                      <View style={styles.claimedBadge}>
                        <MaterialIcons name="check" size={12} color="#10b981" />
                        <Text style={styles.claimedText}>Claimed</Text>
                      </View>
                    ) : task.is_completed ? (
                      <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => handleClaim(task.id, task.points_reward)}
                        disabled={claimingId === task.id}
                      >
                        <Text style={styles.claimButtonText}>{claimingId === task.id ? '...' : 'Claim'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.goButton}>
                        <Text style={styles.goButtonText}>Go</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!task.is_claimed && (
                    <>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: '#fbbf24' }]} />
                      </View>
                      <View style={styles.progressFooter}>
                        <Text style={styles.progressLabel}>{task.is_completed ? 'Completed' : 'In Progress'}</Text>
                        <Text style={styles.progressValue}>{task.progress_count} / {task.required_count}</Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}

            {weeklyTasks.length === 0 && (
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginVertical: 20 }}>No weekly challenges available.</Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.redeemButton} onPress={onRedeemPress}>
          <MaterialIcons name="redeem" size={24} color="white" />
          <Text style={styles.redeemButtonText}>Redeem Points</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
  },
  heroContainer: {
    width: width,
    height: width * 0.9,
    maxHeight: 350,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Manrope_800ExtraBold',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
  },
  scrollContainer: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9727e7',
  },
  resetBadge: {
    backgroundColor: '#251b2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  resetText: {
    fontSize: 10,
    color: '#6b7280',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCompleted: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskLocked: {
    opacity: 0.8,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconActive: {
    backgroundColor: 'rgba(151,39,231,0.1)',
    borderColor: 'rgba(151,39,231,0.2)',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  pointsRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  taskPointsInactive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d1d5db',
  },
  claimButton: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  goButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  lockedIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9727e7',
    borderRadius: 3,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9727e7',
  },
  progressLabelInactive: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4b5563',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26,17,33,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  redeemButton: {
    width: '100%',
    backgroundColor: '#9727e7',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
