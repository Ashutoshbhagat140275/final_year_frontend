import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import * as DocumentPicker from 'expo-document-picker'
import Constants from 'expo-constants'
import {
  getSpeakerEnrollStatus,
  getTrainingStatus,
  submitAudioFeedback,
  uploadAudio
} from '../api/client'
import { EMOTION_LABELS } from '../constants/api'
import { useAuth } from '../context/AuthContext'
import AppButton from '../components/AppButton'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { COLORS, SPACING } from '../theme'

const isPollingStatus = (s) => ['queued', 'running'].includes(s || '')

export default function AudioUploadScreen({ navigation }) {
  const { userId } = useAuth()
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enrollStatus, setEnrollStatus] = useState(null)
  const [enrollLoading, setEnrollLoading] = useState(true)
  const [feedbackEmotion, setFeedbackEmotion] = useState(EMOTION_LABELS[0])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [trainingStatus, setTrainingStatus] = useState(null)
  const [trainingLoading, setTrainingLoading] = useState(false)
  const [trainingError, setTrainingError] = useState('')

  // expo-audio is a native module not available on web or in Expo Go. Only show the
  // recorder where the native module exists (dev/standalone build on a device).
  const isExpoGo =
    Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo'
  const recordingSupported = Platform.OS !== 'web' && !isExpoGo

  const loadEnrollmentStatus = async () => {
    setEnrollLoading(true)
    try {
      setEnrollStatus(await getSpeakerEnrollStatus())
    } catch {
      setEnrollStatus(null)
    } finally {
      setEnrollLoading(false)
    }
  }

  const loadTrainingStatus = async () => {
    if (!userId) return
    setTrainingLoading(true)
    setTrainingError('')
    try {
      setTrainingStatus(await getTrainingStatus(userId))
    } catch (err) {
      setTrainingError(err?.response?.data?.detail || 'Failed to load training status')
    } finally {
      setTrainingLoading(false)
    }
  }

  useEffect(() => { loadEnrollmentStatus() }, [])

  useEffect(() => {
    if (!isPollingStatus(trainingStatus?.status)) return undefined
    const id = setInterval(loadTrainingStatus, 4000)
    return () => clearInterval(id)
  }, [trainingStatus?.status, userId])

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true })
    if (!res.canceled) {
      setFile(res.assets[0])
      setError('')
      setResult(null)
      setFeedbackResult(null)
      setFeedbackError('')
    }
  }

  const handleRecorded = (recordedFile) => {
    setFile(recordedFile)
    setError('')
    setResult(null)
  }

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    setFeedbackError('')
    setFeedbackResult(null)
    setTrainingStatus(null)
    setTrainingError('')
    try {
      const res = await uploadAudio(file)
      setResult(res)
      setFeedbackEmotion(res?.emotion || EMOTION_LABELS[0])
      await loadEnrollmentStatus()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitFeedback = async () => {
    if (!result?.session_id || !feedbackEmotion) return
    setFeedbackLoading(true)
    setFeedbackError('')
    setFeedbackResult(null)
    try {
      const res = await submitAudioFeedback(result.session_id, feedbackEmotion)
      setFeedbackResult(res)
      if (res?.training_triggered) await loadTrainingStatus()
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to submit feedback'
      setFeedbackError(
        String(detail).toLowerCase().includes('not eligible')
          ? `${detail} Enroll your owner voice and upload clearer owner speech segments.`
          : detail
      )
    } finally {
      setFeedbackLoading(false)
    }
  }

  const ownerWarning = useMemo(() => {
    if (!result?.owner_detection_status || result.owner_detection_status === 'verified') return ''
    if (result.owner_detection_status === 'low_confidence') return 'Owner detection is low confidence for this upload. Personalization may be less reliable.'
    if (result.owner_detection_status === 'not_found') return 'Owner voice was not found in this upload. Feedback personalization may be rejected.'
    return ''
  }, [result?.owner_detection_status])

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Card style={styles.mb}>
        <Text style={styles.sectionTitle}>Upload Audio</Text>

        <View style={styles.enrollBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bold}>Speaker Enrollment</Text>
            {enrollLoading ? (
              <Text style={styles.muted}>Checking...</Text>
            ) : enrollStatus ? (
              <Text style={styles.muted}>
                {enrollStatus.enrollment_state} | {enrollStatus.samples_collected}/{enrollStatus.max_samples} samples
              </Text>
            ) : (
              <Text style={{ color: COLORS.red700, fontSize: 13 }}>Status unavailable</Text>
            )}
          </View>
          <AppButton title="Speaker Setup" onPress={() => navigation.navigate('Speaker')} />
        </View>

        <Text style={styles.subsectionTitle}>Record Audio</Text>
        {recordingSupported ? (
          <RecordingSection onRecorded={handleRecorded} />
        ) : (
          <View style={[styles.recordUnavailable, styles.mb]}>
            <Text style={styles.muted}>
              {Platform.OS === 'web'
                ? 'In-app recording isn’t available in the web app. Use the file picker below to upload audio.'
                : 'In-app recording isn’t available in Expo Go. Build a development client (or EAS build) to enable microphone recording. You can still pick and upload an audio file below.'}
            </Text>
          </View>
        )}

        <Text style={styles.subsectionTitle}>Pick Audio File</Text>
        <TouchableOpacity style={styles.dropZone} onPress={pickFile}>
          <Text style={styles.dropText}>Tap to select audio file</Text>
          <Text style={styles.muted}>WAV, MP3, M4A, FLAC, OGG</Text>
        </TouchableOpacity>
        {file ? <Text style={styles.fileName}>Selected: {file.name}</Text> : null}

        <AppButton
          title={loading ? 'Uploading...' : 'Upload'}
          onPress={onUpload}
          disabled={!file || loading}
          loading={loading}
          style={styles.mt}
        />

        {error ? <View style={[styles.errorBox, styles.mt]}><Text style={styles.errorText}>{error}</Text></View> : null}
      </Card>

      {result && (
        <>
          <Card style={styles.mb}>
            <Text style={styles.bold}>Result</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Session: </Text>{result.session_id}</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Emotion: </Text>{result.emotion} ({(result.confidence * 100).toFixed(1)}%)</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Global Head: </Text>{result.global_emotion} ({(result.global_confidence * 100).toFixed(1)}%)</Text>
            <Text style={styles.field}>
              <Text style={styles.fieldLabel}>User Head: </Text>
              {result.user_emotion ? `${result.user_emotion} (${((result.user_confidence || 0) * 100).toFixed(1)}%)` : 'Not available'}
            </Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Blend Weight: </Text>{Number(result.blend_weight || 0).toFixed(3)}</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Time: </Text>{new Date(result.timestamp).toLocaleString()}</Text>
          </Card>

          <Card style={styles.mb}>
            <Text style={styles.bold}>Transcription</Text>
            <Text style={styles.muted}>{result.transcription || '-'}</Text>
          </Card>

          <Card style={styles.mb}>
            <View style={styles.rowSpaced}>
              <Text style={styles.bold}>Owner Detection</Text>
              <StatusBadge status={result.owner_detection_status} />
            </View>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Speech Ratio: </Text>{result.owner_speech_ratio != null ? `${(result.owner_speech_ratio * 100).toFixed(1)}%` : 'N/A'}</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Owner Segments: </Text>{result.owner_segments_count ?? 'N/A'}</Text>
            <Text style={styles.field}><Text style={styles.fieldLabel}>Other Segments: </Text>{result.other_segments_count ?? 'N/A'}</Text>
            {ownerWarning ? (
              <View style={[styles.warnBox, styles.mt]}>
                <Text style={styles.warnText}>{ownerWarning}</Text>
              </View>
            ) : null}
          </Card>

          <Card style={styles.mb}>
            <Text style={styles.bold}>Speaker Timeline</Text>
            {Array.isArray(result.speaker_timeline) && result.speaker_timeline.length > 0 ? (
              <ScrollView horizontal>
                <View>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    {['Speaker', 'Start (s)', 'End (s)', 'Owner Conf'].map((h) => (
                      <Text key={h} style={[styles.tCell, styles.tHeader]}>{h}</Text>
                    ))}
                  </View>
                  {result.speaker_timeline.map((seg, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={styles.tCell}>{seg.speaker_label}</Text>
                      <Text style={styles.tCell}>{Number(seg.start).toFixed(3)}</Text>
                      <Text style={styles.tCell}>{Number(seg.end).toFixed(3)}</Text>
                      <Text style={styles.tCell}>{Number(seg.owner_confidence).toFixed(4)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.muted}>No speaker segments available.</Text>
            )}
          </Card>

          <Card style={styles.mb}>
            <Text style={styles.bold}>Submit Emotion Feedback</Text>
            <Picker
              selectedValue={feedbackEmotion}
              onValueChange={setFeedbackEmotion}
              style={styles.picker}
            >
              {EMOTION_LABELS.map((l) => (
                <Picker.Item key={l} label={l} value={l} />
              ))}
            </Picker>
            <View style={styles.btnRow}>
              <AppButton
                title={feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                onPress={onSubmitFeedback}
                disabled={feedbackLoading || !feedbackEmotion}
              />
              <AppButton
                title={trainingLoading ? 'Refreshing...' : 'Refresh Training'}
                onPress={loadTrainingStatus}
                disabled={trainingLoading || !userId}
                style={{ marginLeft: SPACING.sm }}
              />
            </View>
            {feedbackError ? (
              <View style={[styles.errorBox, styles.mt]}>
                <Text style={styles.errorText}>{feedbackError}</Text>
              </View>
            ) : null}
            {feedbackResult ? (
              <View style={[styles.successBox, styles.mt]}>
                <Text style={styles.successText}>{feedbackResult.message} (count: {feedbackResult.feedback_count})</Text>
              </View>
            ) : null}
          </Card>

          {(trainingStatus || trainingError) && (
            <Card style={styles.mb}>
              <Text style={styles.bold}>Training Status</Text>
              {trainingError ? <View style={styles.errorBox}><Text style={styles.errorText}>{trainingError}</Text></View> : null}
              {trainingStatus && (
                <View>
                  <Text style={styles.field}><Text style={styles.fieldLabel}>Job ID: </Text>{trainingStatus.job_id || '-'}</Text>
                  <Text style={styles.field}><Text style={styles.fieldLabel}>Status: </Text>{trainingStatus.status || 'No jobs yet'}</Text>
                  <Text style={styles.field}><Text style={styles.fieldLabel}>Created: </Text>{trainingStatus.created_at ? new Date(trainingStatus.created_at).toLocaleString() : '-'}</Text>
                  <Text style={styles.field}><Text style={styles.fieldLabel}>Started: </Text>{trainingStatus.started_at ? new Date(trainingStatus.started_at).toLocaleString() : '-'}</Text>
                  <Text style={styles.field}><Text style={styles.fieldLabel}>Completed: </Text>{trainingStatus.completed_at ? new Date(trainingStatus.completed_at).toLocaleString() : '-'}</Text>
                  {trainingStatus.error_message ? (
                    <Text style={[styles.field, { color: COLORS.red700 }]}>
                      <Text style={styles.fieldLabel}>Error: </Text>{trainingStatus.error_message}
                    </Text>
                  ) : null}
                </View>
              )}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  )
}

// Isolated so the native expo-audio module is only required in a build that has it.
// This component is never rendered in Expo Go, so the require() never executes there.
function RecordingSection({ onRecorded }) {
  const { useAudioRecorder, RecordingPresets, AudioModule } = require('expo-audio')
  const [isRecording, setIsRecording] = useState(false)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const startRecording = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission required', 'Microphone access is needed to record audio.')
      return
    }
    await audioRecorder.prepareToRecordAsync()
    audioRecorder.record()
    setIsRecording(true)
  }

  const stopRecording = async () => {
    await audioRecorder.stop()
    setIsRecording(false)
    const uri = audioRecorder.uri
    if (uri) {
      onRecorded({ uri, name: `recording_${Date.now()}.m4a`, mimeType: 'audio/x-m4a' })
    }
  }

  return (
    <AppButton
      title={isRecording ? 'Stop Recording' : 'Start Recording'}
      onPress={isRecording ? stopRecording : startRecording}
      style={styles.mb}
    />
  )
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.gray50 },
  container: { padding: SPACING.md },
  mb: { marginBottom: SPACING.sm },
  mt: { marginTop: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.gray700, marginBottom: SPACING.sm },
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 4 },
  bold: { fontWeight: '600', fontSize: 14, color: COLORS.gray700, marginBottom: 4 },
  muted: { fontSize: 13, color: COLORS.gray500 },
  field: { fontSize: 13, color: COLORS.gray700, marginBottom: 2 },
  fieldLabel: { fontWeight: '600' },
  enrollBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.gray50
  },
  dropText: { fontSize: 14, color: COLORS.gray700 },
  fileName: { fontSize: 13, color: COLORS.gray600, marginTop: 4 },
  rowSpaced: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: 4 },
  errorBox: { backgroundColor: COLORS.red100, borderRadius: 6, padding: SPACING.sm },
  errorText: { color: COLORS.red700, fontSize: 13 },
  successBox: { backgroundColor: COLORS.green100, borderRadius: 6, padding: SPACING.sm },
  successText: { color: COLORS.green800, fontSize: 13 },
  warnBox: { backgroundColor: COLORS.yellow50, borderWidth: 1, borderColor: '#FCD34D', borderRadius: 6, padding: SPACING.sm },
  warnText: { color: '#92400E', fontSize: 13 },
  recordUnavailable: { backgroundColor: COLORS.yellow50, borderWidth: 1, borderColor: '#FCD34D', borderRadius: 6, padding: SPACING.sm },
  picker: { height: 50, marginVertical: SPACING.sm },
  tableRow: { flexDirection: 'row' },
  tableHeaderRow: { borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  tCell: { width: 110, fontSize: 12, color: COLORS.gray700, padding: 6 },
  tHeader: { fontWeight: '600', color: COLORS.gray600 }
})
