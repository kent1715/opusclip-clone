import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const OAUTH_CONFIGS: Record<string, {
  authorizationUrl: string
  scope: string
  clientIdEnv: string
}> = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email',
    clientIdEnv: 'GITHUB_CLIENT_ID',
  },
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params

    const config = OAUTH_CONFIGS[provider.toLowerCase()]
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported OAuth provider: ${provider}` },
        { status: 400 }
      )
    }

    const clientId = process.env[config.clientIdEnv]
    if (!clientId) {
      console.error(`Missing env var: ${config.clientIdEnv}`)
      return NextResponse.redirect(`${BASE_URL}/?social=error`)
    }

    // Generate state for CSRF protection
    const state = randomUUID()

    const redirectUri = `${BASE_URL}/api/auth/oauth/${provider.toLowerCase()}/callback`

    // Build the authorization URL
    const authUrl = new URL(config.authorizationUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.scope)
    authUrl.searchParams.set('state', state)

    // For Google, add prompt=consent to ensure we get a refresh token
    if (provider.toLowerCase() === 'google') {
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('access_type', 'offline')
    }

    // Redirect to the provider's authorization URL
    const response = NextResponse.redirect(authUrl.toString())

    // Store state in a cookie for CSRF verification
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.redirect(`${BASE_URL}/?social=error`)
  }
}
