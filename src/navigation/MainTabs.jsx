import React from 'react'
import { TouchableOpacity } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import DashboardScreen from '../screens/DashboardScreen'
import AudioUploadScreen from '../screens/AudioUploadScreen'
import SpeakerEnrollmentScreen from '../screens/SpeakerEnrollmentScreen'
import RAGQueryScreen from '../screens/RAGQueryScreen'
import { COLORS } from '../theme'

const Tab = createBottomTabNavigator()

function LogoutButton() {
  const { logout } = useAuth()
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
      <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
    </TouchableOpacity>
  )
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        headerRight: () => <LogoutButton />
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Upload"
        component={AudioUploadScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cloud-upload-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Speaker"
        component={SpeakerEnrollmentScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="Query"
        component={RAGQueryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  )
}
