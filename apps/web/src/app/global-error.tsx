'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center'
          }}>
            {/* Icono */}
            <div style={{
              margin: '0 auto 1.5rem',
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#dc2626" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            {/* Título */}
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '0.5rem'
            }}>
              Algo salió mal
            </h1>

            {/* Descripción */}
            <p style={{
              color: '#64748b',
              marginBottom: '1.5rem'
            }}>
              Ocurrió un error inesperado. Por favor, intenta nuevamente.
            </p>

            {/* Código de error */}
            {error.digest && (
              <p style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontFamily: 'monospace',
                marginBottom: '1.5rem'
              }}>
                Código: {error.digest}
              </p>
            )}

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: '#0f172a'
                }}
              >
                Intentar de nuevo
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Volver al inicio
              </a>
            </div>

            {/* Contacto */}
            <p style={{
              marginTop: '2rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              Si el problema persiste, contáctanos a{' '}
              <a 
                href="mailto:contacto@calmar.cl"
                style={{ color: '#0891b2' }}
              >
                contacto@calmar.cl
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
