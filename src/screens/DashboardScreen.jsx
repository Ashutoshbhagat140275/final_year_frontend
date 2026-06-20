import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { getEmotions, getStats } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import AppButton from '../components/AppButton'
import EmotionChart from '../components/EmotionChart'
import DateField from '../components/DateField'
import { COLORS, SPACING } from '../theme'

export default function DashboardScreen({ navigation }) {
  const { userId } = useAuth()
  const [stats, setStats] = useState(null)
  const [emotions, setEmotions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const formatDate = (d) => (d ? d.toISOString().slice(0, 19) : '')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const [s, e] = await Promise.all([
        getStats(userId),
        getEmotions(userId, {
          start_date: formatDate(startDate) || undefined,
          end_date: formatDate(endDate) || undefined,
          limit: 100
        })
      ])
      setStats(s)
      setEmotions(e.emotions || [])
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || ''
      if (detail.includes('404') || detail.includes('Not Found')) {
        setStats({ total_sessions: 0, emotion_distribution: {}, avg_confidence: 0 })
        setEmotions([])
      } else {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }, [userId, startDate, endDate])

  useEffect(() => {
    if (userId) load()
  }, [userId])

  const renderRow = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
      <Text style={[styles.cell, { flex: 1.5 }]} numberOfLines={1}>
        {(item.session_id || '').slice(0, 8)}...
      </Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.emotion_label}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{(item.confidence * 100).toFixed(1)}%</Text>
    </View>
  )

  return (
    <FlatList
      style={styles.bg}
      contentContainerStyle={styles.container}
      data={emotions}
      keyExtractor={(item, idx) => `${item.session_id}-${idx}`}
      renderItem={renderRow}
      ListHeaderComponent={
        <View>
          <Card style={styles.mb}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {loading ? (
              <Text style={styles.muted}>Loading dashboard data...</Text>
            ) : stats && stats.total_sessions > 0 ? (
              <View>
                <View style={styles.statsRow}>
                  <Card style={[styles.statCard, styles.shadow]}>
                    <Text style={styles.statLabel}>Total Sessions</Text>
                    <Text style={styles.statValue}>{stats.total_sessions}</Text>
                  </Card>
                  <Card style={[styles.statCard, styles.shadow]}>
                    <Text style={styles.statLabel}>Avg Confidence</Text>
                    <Text style={styles.statValue}>{Number(stats.avg_confidence).toFixed(3)}</Text>
                  </Card>
                </View>
                <Card style={[styles.mt, styles.shadow]}>
                  <Text style={styles.statLabel}>Emotion Distribution</Text>
                  <EmotionChart distribution={stats.emotion_distribution} />
                </Card>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No audio data yet</Text>
                <Text style={styles.emptySubtitle}>
                  Upload your first audio file to start analyzing emotions.
                </Text>
                <AppButton
                  title="Upload Audio"
                  onPress={() => navigation.navigate('Upload')}
                  style={styles.mt}
                />
              </View>
            )}
          </Card>

          <Card style={styles.mb}>
            <Text style={styles.sectionTitle}>Recent Emotions</Text>
            <View style={styles.filtersRow}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Start Date</Text>
                <DateField value={startDate} onChange={setStartDate} />
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>End Date</Text>
                <DateField value={endDate} onChange={setEndDate} />
              </View>
              <AppButton title="Apply" onPress={load} />
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 2 }]}>Timestamp</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Session</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Emotion</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Conf.</Text>
            </View>
          </Card>
        </View>
      }
      ListEmptyComponent={
        !loading ? (
          <Card>
            <Text style={[styles.muted, { textAlign: 'center' }]}>No emotion records found</Text>
          </Card>
        ) : null
      }
    />
  )
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.gray50 },
  container: { padding: SPACING.md, gap: SPACING.sm },
  mb: { marginBottom: SPACING.sm },
  mt: { marginTop: SPACING.sm },
  shadow: {},
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray700, marginBottom: SPACING.sm },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: COLORS.gray500 },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.gray700 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.lg },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray600, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: COLORS.gray500, textAlign: 'center' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.sm },
  filterItem: { flex: 1, minWidth: 100 },
  filterLabel: { fontSize: 11, color: COLORS.gray500, marginBottom: 2 },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  headerCell: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, backgroundColor: COLORS.white },
  cell: { fontSize: 12, color: COLORS.gray700 },
  errorBox: { backgroundColor: COLORS.red100, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red700, fontSize: 13 },
  muted: { fontSize: 13, color: COLORS.gray500 }
})
