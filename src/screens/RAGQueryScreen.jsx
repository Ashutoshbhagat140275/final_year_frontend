import React, { useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { queryRAG } from '../api/client'
import AppButton from '../components/AppButton'
import AppTextInput from '../components/AppTextInput'
import Card from '../components/Card'
import { COLORS, SPACING } from '../theme'

export default function RAGQueryScreen() {
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState('5')
  const [answer, setAnswer] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setAnswer(null)
    setSources([])
    try {
      const res = await queryRAG(query, Number(topK) || 5)
      setAnswer(res.answer)
      setSources(res.sources || [])
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || ''
      if (detail.includes('not found') || detail.includes('404')) {
        setError('No audio data available. Please upload audio files first.')
      } else if (detail.includes('Ollama') || detail.includes('AI service')) {
        setError('AI service is temporarily unavailable. Please try again later.')
      } else if (detail) {
        setError(detail.length > 100 ? 'An error occurred. Please try again.' : detail)
      } else {
        setError('Failed to process your query')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <FlatList
      style={styles.bg}
      contentContainerStyle={styles.container}
      data={sources}
      keyExtractor={(_, idx) => String(idx)}
      renderItem={({ item }) => (
        <Card style={styles.mb}>
          <Text style={styles.sourceMeta}>
            Session: {item.session_id} | Score: {item.score?.toFixed(3)} | {new Date(item.timestamp).toLocaleString()}
          </Text>
          <Text style={styles.sourceText}>{item.text}</Text>
        </Card>
      )}
      ListHeaderComponent={
        <View>
          <Card style={styles.mb}>
            <Text style={styles.title}>RAG Query</Text>
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask something about your audio notes..."
              multiline
              returnKeyType="done"
              style={styles.queryInput}
            />
            <View style={styles.row}>
              <AppTextInput
                value={topK}
                onChangeText={setTopK}
                keyboardType="numeric"
                placeholder="Top K"
                style={styles.topKInput}
              />
              <AppButton
                title={loading ? 'Asking...' : 'Ask'}
                onPress={onSubmit}
                disabled={loading || !query.trim()}
                loading={loading}
              />
            </View>
            {error ? (
              <View style={[styles.errorBox, styles.mt]}>
                <Text style={styles.errorTitle}>Warning</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </Card>

          {answer && (
            <Card style={[styles.mb, styles.answerCard]}>
              <Text style={styles.bold}>Answer</Text>
              <Text style={styles.answerText}>{answer}</Text>
            </Card>
          )}

          {answer && !sources.length && (
            <Card style={[styles.mb, styles.tipCard]}>
              <Text style={styles.bold}>Tip</Text>
              <Text style={styles.muted}>
                No audio files have been uploaded yet. Upload some audio files to enable AI-powered question answering.
              </Text>
            </Card>
          )}

          {sources.length > 0 && (
            <Text style={styles.sourcesTitle}>Sources</Text>
          )}
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  bg: { backgroundColor: COLORS.gray50 },
  container: { padding: SPACING.md },
  mb: { marginBottom: SPACING.sm },
  mt: { marginTop: SPACING.sm },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.gray700, marginBottom: SPACING.sm },
  bold: { fontWeight: '600', fontSize: 14, color: COLORS.gray700, marginBottom: 4 },
  muted: { fontSize: 13, color: COLORS.gray500 },
  queryInput: { marginBottom: SPACING.sm, minHeight: 64, textAlignVertical: 'top' },
  topKInput: { width: 72, marginRight: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 6, padding: SPACING.sm },
  errorTitle: { fontWeight: '600', fontSize: 13, color: COLORS.red700, marginBottom: 2 },
  errorText: { color: COLORS.red700, fontSize: 13 },
  answerCard: { backgroundColor: COLORS.blue50, borderWidth: 1, borderColor: '#BFDBFE' },
  answerText: { fontSize: 14, color: COLORS.gray700, lineHeight: 22 },
  tipCard: { backgroundColor: COLORS.yellow50, borderWidth: 1, borderColor: '#FCD34D' },
  sourcesTitle: { fontSize: 16, fontWeight: '600', color: COLORS.gray700, marginBottom: SPACING.sm },
  sourceMeta: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  sourceText: { fontSize: 13, color: COLORS.gray700 }
})
