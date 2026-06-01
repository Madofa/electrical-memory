import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { supabase, getInstalador, getMemorias } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useWizardStore } from './stores/wizardStore'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { ProfileSetup } from './pages/ProfileSetup'
import { Wizard } from './pages/Wizard'
import { EsquemaUnifilarList } from './pages/EsquemaUnifilarList'
import { MemoriaDescriptivaList } from './pages/MemoriaDescriptivaList'
import { Elec1List } from './pages/Elec1List'
import { Elec3List } from './pages/Elec3List'
import { ProjecteList } from './pages/ProjecteList'
const ProjectePage = lazy(() => import('./pages/ProjectePage').then((m) => ({ default: m.ProjectePage })))

// El motor PDF (@react-pdf/renderer) pesa ~1.5 MB — lo cargamos sólo cuando
// el usuario navega a la vista previa.
const PDFViewer = lazy(() => import('./pages/PDFViewer').then((m) => ({ default: m.PDFViewer })))
const EsquemaUnifilarEditor = lazy(() => import('./pages/EsquemaUnifilarEditor').then((m) => ({ default: m.EsquemaUnifilarEditor })))
const MemoriaDescriptivaEditor = lazy(() => import('./pages/MemoriaDescriptivaEditor').then((m) => ({ default: m.MemoriaDescriptivaEditor })))
const Elec1Editor = lazy(() => import('./pages/Elec1Editor').then((m) => ({ default: m.Elec1Editor })))
const Elec3Editor = lazy(() => import('./pages/Elec3Editor').then((m) => ({ default: m.Elec3Editor })))

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

async function loadDraftFromServer(userId: string) {
  const { data: memorias } = await getMemorias(userId)
  const draft = memorias?.find((m) => m.estado === 'borrador')
  if (draft?.wizard_data) {
    useWizardStore.getState().loadMemoria(draft.id, draft.wizard_data)
  }
}

export default function App() {
  const { setUser, setInstalador, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getInstalador(session.user.id).then(setInstalador)
        loadDraftFromServer(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getInstalador(session.user.id).then(setInstalador)
        loadDraftFromServer(session.user.id)
      } else {
        setInstalador(null)
      }
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<RequireAuth><ProjecteList /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/projectes" element={<RequireAuth><ProjecteList /></RequireAuth>} />
        <Route
          path="/projectes/:id"
          element={
            <RequireAuth>
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" /></div>}>
                  <ProjectePage />
                </Suspense>
              </ErrorBoundary>
            </RequireAuth>
          }
        />
        <Route path="/perfil" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
        <Route path="/wizard" element={<RequireAuth><Wizard /></RequireAuth>} />
        <Route path="/unifilar" element={<RequireAuth><EsquemaUnifilarList /></RequireAuth>} />
        <Route path="/memoria-descriptiva" element={<RequireAuth><MemoriaDescriptivaList /></RequireAuth>} />
        <Route path="/elec1" element={<RequireAuth><Elec1List /></RequireAuth>} />
        <Route path="/elec3" element={<RequireAuth><Elec3List /></RequireAuth>} />
        <Route path="/elec3/:id" element={<RequireAuth><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" /></div>}><Elec3Editor /></Suspense></RequireAuth>} />
        <Route path="/elec1/:id" element={<RequireAuth><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" /></div>}><Elec1Editor /></Suspense></RequireAuth>} />
        <Route path="/memoria-descriptiva/:id" element={<RequireAuth><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" /></div>}><MemoriaDescriptivaEditor /></Suspense></RequireAuth>} />
        <Route
          path="/unifilar/:id"
          element={
            <RequireAuth>
              <Suspense
                fallback={
                  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-[12px] text-slate-500 font-mono">Carregant editor…</p>
                  </div>
                }
              >
                <EsquemaUnifilarEditor />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/pdf/:id"
          element={
            <RequireAuth>
              <Suspense
                fallback={
                  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-[12px] text-slate-500 font-mono">Cargando motor PDF…</p>
                  </div>
                }
              >
                <PDFViewer />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
