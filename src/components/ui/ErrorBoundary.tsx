import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
          <div className="text-red-400 text-4xl">⚠</div>
          <h2 className="font-display font-bold text-xl uppercase text-slate-300">S'ha produït un error</h2>
          <p className="text-slate-500 text-sm font-mono max-w-md text-center break-all">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-2"
          >
            Recarregar la pàgina
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
