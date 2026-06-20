import Constants from 'expo-constants'

const BASE = Constants.expoConfig?.extra?.apiBaseUrl || 'http://10.0.2.2:8000'

export const ENDPOINTS = {
  register: `${BASE}/api/auth/register`,
  login: `${BASE}/api/auth/login`,
  uploadAudio: `${BASE}/api/audio/upload`,
  audioFeedback: `${BASE}/api/audio/feedback`,
  ragQuery: `${BASE}/api/rag/query`,
  speakerEnrollStart: `${BASE}/api/speaker/enroll/start`,
  speakerEnrollUpload: `${BASE}/api/speaker/enroll/upload`,
  speakerEnrollComplete: `${BASE}/api/speaker/enroll/complete`,
  speakerEnrollStatus: `${BASE}/api/speaker/enroll/status`,
  trainingStatus: (userId) => `${BASE}/api/training-status/${userId}`,
  emotions: (userId, qs = '') => `${BASE}/api/dashboard/emotions/${userId}${qs ? `?${qs}` : ''}`,
  stats: (userId) => `${BASE}/api/dashboard/stats/${userId}`
}

export const EMOTION_LABELS = [
  'neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'
]

export const OWNER_DETECTION_STATUSES = ['verified', 'low_confidence', 'not_found']
