import Sentry from "integrations/sentry"
import { useEffect } from "react"
import { AppProps, useRouter, useSession } from "blitz"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { queryCache } from "react-query"
import ErrorComponent from "app/components/ErrorComponent"

export default function App({ Component, pageProps, err }: AppProps & { err: any }) {
  const session = useSession()
  const getLayout = Component.getLayout || ((page) => page)
  const router = useRouter()

  useEffect(() => {
    if (session.userId) Sentry.setUser({ id: session.userId.toString() })
  }, [session])

  return (
    <ErrorBoundary
      onError={(error, componentStack) => {
        Sentry.captureException(error, { contexts: { react: { componentStack } } })
      }}
      FallbackComponent={RootErrorFallback}
      resetKeys={[router.asPath]}
      onReset={() => {
        // This ensures the Blitz useQuery hooks will automatically refetch
        // data any time you reset the error boundary
        queryCache.resetErrorBoundaries()
      }}
    >
      {getLayout(<Component {...pageProps} err={err} />)}
    </ErrorBoundary>
  )
}

function RootErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  if (error?.name === "AuthenticationError") {
    return <h1>Login form</h1>
  } else if (error?.name === "AuthorizationError") {
    return (
      <ErrorComponent
        statusCode={(error as any).statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  } else {
    return (
      <ErrorComponent
        statusCode={(error as any)?.statusCode || 400}
        title={error?.message || error?.name || "Unknown error"}
      />
    )
  }
}
