import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  isAuthenticated: boolean
  loading?: boolean
  children: React.ReactNode
}

export function AuthGuard({ children, isAuthenticated, loading }: AuthGuardProps) {
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
