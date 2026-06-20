import React, { useEffect } from 'react'
import { ActivityIndicator, Platform, View } from 'react-native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { setNavigationRef } from '../api/client'
import AuthStack from './AuthStack'
import MainTabs from './MainTabs'
import { COLORS } from '../theme'

export const navigationRef = createNavigationContainerRef()

const RootStack = createNativeStackNavigator()

// Give every screen its own URL on the web/PWA build (e.g. /dashboard, /upload).
// Enabled only on web — native uses gesture/stack navigation, not URLs.
const linking = {
  enabled: Platform.OS === 'web',
  prefixes: [],
  config: {
    screens: {
      Auth: { screens: { Login: 'login', Register: 'register' } },
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Upload: 'upload',
          Speaker: 'speaker',
          Query: 'query'
        }
      }
    }
  }
}

export default function AppNavigator() {
  const { isAuthenticated, hydrating } = useAuth()

  useEffect(() => {
    setNavigationRef(navigationRef)
  }, [])

  if (hydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated
          ? <RootStack.Screen name="Main" component={MainTabs} />
          : <RootStack.Screen name="Auth" component={AuthStack} />
        }
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
