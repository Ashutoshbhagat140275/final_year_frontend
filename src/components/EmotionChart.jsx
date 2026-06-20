import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, SPACING } from '../theme'

export default function EmotionChart({ distribution }) {
  const entries = Object.entries(distribution || {})
  const total = entries.reduce((acc, [, v]) => acc + v, 0)
  if (!entries.length) return <Text style={{ color: COLORS.gray500, fontSize: 13 }}>No data</Text>

  return (
    <View>
      <View style={styles.bar}>
        {entries.map(([label, count], idx) => {
          const pct = total ? (count / total) * 100 : 0
          return (
            <View
              key={label}
              style={[styles.segment, { width: `${pct}%`, backgroundColor: COLORS.chart[idx % COLORS.chart.length] }]}
            />
          )
        })}
      </View>
      <View style={styles.legend}>
        {entries.map(([label, count], idx) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.chart[idx % COLORS.chart.length] }]} />
            <Text style={styles.legendLabel}>{label}</Text>
            <Text style={styles.legendCount}>({count})</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray200
  },
  segment: { height: '100%' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.sm
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, color: COLORS.gray700 },
  legendCount: { fontSize: 12, color: COLORS.gray500 }
})
