import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet } from 'react-router'
import { DependenciesProvider } from '../../core/di/dependencies'
import { AuthProvider } from '../../features/auth/application/auth-context'
import { ToastProvider } from '../../shared/ui/toast'
import { dependencies } from '../composition-root'
import { RealtimeSync } from '../RealtimeSync'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        return status !== undefined && status < 500 ? false : failureCount < 2
      },
      refetchOnWindowFocus: true,
      staleTime: 15_000,
      // Si la conexión en tiempo real falla, actualiza cada 30 s con la pestaña visible.
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    },
  },
})

export function AttendanceLayout() {
  return (
    <DependenciesProvider value={dependencies}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RealtimeSync />
            <Outlet />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </DependenciesProvider>
  )
}
