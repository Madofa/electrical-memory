import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase, getInstalador } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ProfileSetup } from './pages/ProfileSetup'
import { Wizard } from './pages/Wizard'
import { PDFViewer } from './pages/PDFViewer'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { setUser, setInstalador, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) getInstalador(session.user.id).then(setInstalador)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) getInstalador(session.user.id).then(setInstalador)
      else setInstalador(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1729',
            color: '#e2e8f0',
            border: '1px solid #1e2d47',
            fontFamily: 'Barlow, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#0a0f1e' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0a0f1e' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/perfil" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
        <Route path="/wizard" element={<RequireAuth><Wizard /></RequireAuth>} />
        <Route path="/pdf/:id" element={<RequireAuth><PDFViewer /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
