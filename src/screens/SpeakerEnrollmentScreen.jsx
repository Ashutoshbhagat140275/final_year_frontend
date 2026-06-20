import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import {
  completeSpeakerEnrollment,
  getSpeakerEnrollStatus,
  startSpeakerEnrollment,
  uploadSpeakerEnrollmentClip
} from '../api/client'
import AppButton from '../components/AppButton'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { COLORS, SPACING } from '../theme'

export default function SpeakerEnrollmentScreen() {
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadStatus = async () => {
    setLoadingStatus(true)
    setError('')
    try {
      setStatus(await getSpeakerEnrollStatus())
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load enrollment status')
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => { loadStatus() }, [])

  const onStart = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await startSpeakerEnrollment()
      setMessage(res.message || 'Enrollment started')
      setSelectedFile(null)
      await loadStatus()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to start enrollment')
    } finally {
      setBusy(false)
    }
  }

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true })
    if (!res.canceled) {
      setSelectedFile(res.assets[0])
      setError('')
    }
  }

  const onUpload = async () => {
    if (!selectedFile) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await uploadSpeakerEnrollmentClip(selectedFile)
      setMessage(res.message || 'Enrollment clip uploaded')
      setSelectedFile(null)
      await loadStatus()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to upload enrollment clip')
    } finally {
      setBusy(false)
    }
  }

  const onComplete = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await completeSpeakerEnrollment()
      setMessage(res.message || 'Enrollment completed')
      await loadStatus()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to complete enrollment')
    } finally {
      setBusy(false)
    }
  }

  const canUpload = useMemo(() => {
    if (!status || !selectedFile || busy) return false
    return status.samples_collected < status.max_samples
  }, [busy, selectedFile, status])

  const canComplete = useMemo(() => {
    if (!status || busy) return false
    return status.samples_collected >= status.required_samples && !status.enrolled
  }, [busy, status])

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Card style={styles.mb}>
        <Text style={styles.title}>Speaker Enrollment</Text>
        <Text style={styles.desc}>
          Enroll your owner voice in 3-5 clean clips so emotion personalization can use owner-only speech.
        </Text>

        {loadingStatus ? (
          <Text style={styles.muted}>Loading enrollment status...</Text>
        ) : status ? (
          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <Text style={styles.bold}>State: </Text>
              <StatusBadge status={status.enrollment_state} />
              {status.enrolled ? <StatusBadge status="enrolled" /> : null}
            </View>
            <Text style={styles.muted}>
              Samples: {status.samples_collected}/{status.max_samples} (min required: {status.required_samples})
            </Text>
            <Text style={[styles.muted, { marginTop: 2 }]}>
              Last update: {status.updated_at ? new Date(status.updated_at).toLocaleString() : 'N/A'}
            </Text>
          </View>
        ) : null}

        <AppButton
          title={busy ? 'Working...' : 'Start / Reset Enrollment'}
          onPress={onStart}
          disabled={busy}
          style={styles.mt}
        />
      </Card>

      <Card style={styles.mb}>
        <Text style={styles.bold}>Upload Enrollment Clip</Text>
        <Text style={styles.hint}>Use a quiet environment, single speaker, 5-10s clip.</Text>
        <AppButton title="Pick Audio File" onPress={pickFile} style={styles.mt} />
        {selectedFile ? (
          <Text style={[styles.muted, styles.mt]}>Selected: {selectedFile.name}</Text>
        ) : null}
        <AppButton
          title={busy ? 'Working...' : 'Upload Clip'}
          onPress={onUpload}
          disabled={!canUpload}
          style={styles.mt}
        />
      </Card>

      <Card style={styles.mb}>
        <AppButton
          title={busy ? 'Working...' : 'Complete Enrollment'}
          onPress={onComplete}
          disabled={!canComplete}
        />
      </Card>

      {message ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{message}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.gray50 },
  container: { padding: SPACING.md },
  mb: { marginBottom: SPACING.sm },
  mt: { marginTop: SPACING.sm },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.gray700, marginBottom: 4 },
  desc: { fontSize: 13, color: COLORS.gray600, marginBottom: SPACING.sm },
  bold: { fontWeight: '600', fontSize: 14, color: COLORS.gray700 },
  muted: { fontSize: 13, color: COLORS.gray500 },
  hint: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  statusBox: { backgroundColor: COLORS.gray50, borderRadius: 8, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.gray200 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4, flexWrap: 'wrap' },
  successBox: { backgroundColor: COLORS.green100, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
  successText: { color: COLORS.green800, fontSize: 13 },
  errorBox: { backgroundColor: COLORS.red100, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red700, fontSize: 13 }
})
