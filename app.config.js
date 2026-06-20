export default {
  expo: {
    name: 'RAG Audio',
    slug: 'rag-audio-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    plugins: [
      'expo-document-picker',
      ['expo-audio', { microphonePermission: 'Allow RAG Audio to record audio.' }]
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.2.2:8000'
    },
    ios: {
      bundleIdentifier: 'com.secondbrain.ragaudio',
      infoPlist: {
        NSMicrophoneUsageDescription: 'Allow RAG Audio to record audio.'
      }
    },
    android: {
      package: 'com.secondbrain.ragaudio',
      adaptiveIcon: {
        backgroundColor: '#4F46E5'
      }
    }
  }
}
