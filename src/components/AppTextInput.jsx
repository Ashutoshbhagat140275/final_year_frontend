import React, { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { COLORS, RADIUS, SPACING } from '../theme'

export default function AppTextInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <TextInput
      style={[styles.input, focused && styles.focused, style]}
      placeholderTextColor={COLORS.gray500}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.gray700,
    backgroundColor: COLORS.white
  },
  focused: { borderColor: COLORS.primary }
})
