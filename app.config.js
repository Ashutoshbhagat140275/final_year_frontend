export default {
  expo: {
    name: 'RAG Audio',
    slug: 'rag-audio-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#4F46E5'
    },
    plugins: [
      'expo-document-picker',
      ['expo-audio', { microphonePermission: 'Allow RAG Audio to record audio.' }]
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.2.2:8000'
    },
    ios: {
      bundleIdentifier: 'com.secondbrain.ragaudio',
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: 'Allow RAG Audio to record audio.'
      }
    },
    android: {
      package: 'com.secondbrain.ragaudio',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4F46E5'
      }
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
      name: 'RAG Audio',
      shortName: 'RAG Audio',
      description: 'AI-powered audio emotion analysis',
      themeColor: '#4F46E5',
      backgroundColor: '#4F46E5',
      display: 'standalone',
      startUrl: '/',
      orientation: 'portrait',
      lang: 'en'
    }
  }
}
