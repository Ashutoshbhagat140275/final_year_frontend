import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { login as apiLogin, register as apiRegister, setAuthToken, clearAuthToken } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [preview, setPreview] = useState(false)
  const isAuthenticated = Boolean(token) || preview

  useEffect(() => {
    AsyncStorage.multiGet(['access_token', 'user_id'])
      .then(([[, t], [, u]]) => {
        if (t) { setToken(t); setAuthToken(t) }
        if (u) setUserId(u)
      })
      .finally(() => setHydrating(false))
  }, [])

  useEffect(() => {
    if (token) {
      AsyncStorage.setItem('access_token', token)
      setAuthToken(token)
    } else {
      AsyncStorage.removeItem('access_token')
      clearAuthToken()
    }
  }, [token])

  useEffect(() => {
    if (userId) AsyncStorage.setItem('user_id', userId)
    else AsyncStorage.removeItem('user_id')
  }, [userId])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      setToken(res.access_token)
      setUserId(res.user_id)
      return res
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password) => {
    setLoading(true)
    try {
      const res = await apiRegister(email, password)
      return res
    } finally {
      setLoading(false)
    }
  }

  // Dev/demo helper: browse the app's screens without a backend or real login.
  // API calls still fail (no valid token), so screens show their shells / empty
  // states rather than real data — enough to preview the UI.
  const enterPreview = () => {
    setUserId('preview-user')
    setPreview(true)
  }

  const logout = () => {
    setToken('')
    setUserId('')
    setPreview(false)
  }

  const value = useMemo(() => ({
    token, userId, isAuthenticated, loading, hydrating, login, logout, register, enterPreview
  }), [token, userId, isAuthenticated, loading, hydrating, preview])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
