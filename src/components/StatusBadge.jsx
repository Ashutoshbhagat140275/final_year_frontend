import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, SPACING } from '../theme'

const STATUS_STYLES = {
  completed: { bg: COLORS.green100, text: COLORS.green800 },
  enrolled: { bg: COLORS.green100, text: COLORS.green800 },
  collecting: { bg: '#FEF3C7', text: '#92400E' },
  verified: { bg: COLORS.green100, text: COLORS.green800 },
  low_confidence: { bg: '#FEF3C7', text: '#92400E' },
  not_found: { bg: COLORS.red100, text: COLORS.red700 }
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: COLORS.gray100, text: COLORS.gray700 }
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{status || 'unknown'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm
  },
  text: { fontSize: 12, fontWeight: '600' }
})
