import React, { useState } from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { COLORS } from '../theme'

// Native date field: a tappable value that opens the platform DateTimePicker.
export default function DateField({ value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setShow(true)}>
        <Text style={styles.text}>{value ? value.toLocaleDateString() : 'Any'}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={(_, d) => {
            setShow(Platform.OS === 'ios')
            if (d) onChange(d)
          }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  text: { fontSize: 13, color: COLORS.gray700 }
})
