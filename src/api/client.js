import axios from 'axios'
import { ENDPOINTS } from '../constants/api'

let memoryToken = ''
let navigationRefGlobal = null

export const setAuthToken = (token) => { memoryToken = token }
export const clearAuthToken = () => { memoryToken = '' }

// Injected by AppNavigator to avoid circular dependency
export const setNavigationRef = (ref) => { navigationRefGlobal = ref }

const api = axios.create({ withCredentials: false })

api.interceptors.request.use((config) => {
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      memoryToken = ''
      navigationRefGlobal?.reset({ index: 0, routes: [{ name: 'Auth' }] })
    }
    return Promise.reject(err)
  }
)

export const register = async (email, password) => {
  const { data } = await api.post(ENDPOINTS.register, { email, password })
  return data
}

export const login = async (email, password) => {
  const { data } = await api.post(ENDPOINTS.login, { email, password })
  return data
}

// Build a multipart upload that works on both native and web (PWA).
// - Web: expo-document-picker gives a real `File` (file.file). Append it and let
//   the browser set Content-Type WITH the multipart boundary (don't set it manually).
// - Native: append the React Native descriptor { uri, name, type } and set the
//   multipart Content-Type explicitly.
const buildAudioUpload = (file) => {
  const formData = new FormData()
  if (file?.file) {
    formData.append('file', file.file, file.name)
    return { formData, config: {} }
  }
  formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'audio/wav' })
  return { formData, config: { headers: { 'Content-Type': 'multipart/form-data' } } }
}

export const uploadAudio = async (file) => {
  const { formData, config } = buildAudioUpload(file)
  const { data } = await api.post(ENDPOINTS.uploadAudio, formData, config)
  return data
}

export const submitAudioFeedback = async (sessionId, correctedEmotion) => {
  const { data } = await api.post(ENDPOINTS.audioFeedback, {
    session_id: sessionId,
    corrected_emotion: correctedEmotion
  })
  return data
}

export const queryRAG = async (query, topK = 5) => {
  const { data } = await api.post(ENDPOINTS.ragQuery, { query, top_k: topK })
  return data
}

export const getEmotions = async (userId, params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const qs = new URLSearchParams(cleanParams).toString()
  const { data } = await api.get(ENDPOINTS.emotions(userId, qs))
  return data
}

export const getStats = async (userId) => {
  const { data } = await api.get(ENDPOINTS.stats(userId))
  return data
}

export const getTrainingStatus = async (userId) => {
  const { data } = await api.get(ENDPOINTS.trainingStatus(userId))
  return data
}

export const getSpeakerEnrollStatus = async () => {
  const { data } = await api.get(ENDPOINTS.speakerEnrollStatus)
  return data
}

export const startSpeakerEnrollment = async () => {
  const { data } = await api.post(ENDPOINTS.speakerEnrollStart)
  return data
}

export const uploadSpeakerEnrollmentClip = async (file) => {
  const { formData, config } = buildAudioUpload(file)
  const { data } = await api.post(ENDPOINTS.speakerEnrollUpload, formData, config)
  return data
}

export const completeSpeakerEnrollment = async () => {
  const { data } = await api.post(ENDPOINTS.speakerEnrollComplete)
  return data
}

export default api
