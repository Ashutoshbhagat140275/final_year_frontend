import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { setNavigationRef } from '../api/client'
import AuthStack from './AuthStack'
import MainTabs from './MainTabs'
import { COLORS } from '../theme'

export const navigationRef = createNavigationContainerRef()

const RootStack = createNativeStackNavigator()

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
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated
          ? <RootStack.Screen name="Main" component={MainTabs} />
          : <RootStack.Screen name="Auth" component={AuthStack} />
        }
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
