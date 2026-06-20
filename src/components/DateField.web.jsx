import React from 'react'

// Web date field: a native HTML date input (react-native-web renders to the DOM,
// so a lowercase <input> element works here). Avoids pulling in the native-only
// @react-native-community/datetimepicker on web.
export default function DateField({ value, onChange }) {
  const str = value ? value.toISOString().slice(0, 10) : ''
  return (
    <input
      type="date"
      value={str}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
      style={{
        padding: '7px 10px',
        borderRadius: 6,
        border: '1px solid #D1D5DB',
        fontSize: 13,
        color: '#374151',
        fontFamily: 'inherit',
        backgroundColor: '#FFFFFF'
      }}
    />
  )
}
