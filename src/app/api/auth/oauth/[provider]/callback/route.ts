import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { SESSION_COOKIE } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface OAuthTokenResponse {
  access_token: string
  token_type?: string
  scope?: string
  id_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

interface GitHubUserInfo {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

async function exchangeCodeForToken(
  provider: string,
  code: string
): Promise<OAuthTokenResponse> {
  const redirectUri = `${BASE_URL}/api/auth/oauth/${provider}/callback`

  if (provider === 'google') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Google token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }

    return res.json()
  }

  if (provider === 'github') {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('GitHub token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }

    return res.json()
  }

  throw new Error(`Unsupported provider: ${provider}`)
}

async function fetchGoogleProfile(
  accessToken: string
): Promise<{ email: string; name: string; image: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch Google user profile')
  }

  const profile: GoogleUserInfo = await res.json()
  return {
    email: profile.email,
    name: profile.name,
    image: profile.picture,
  }
}

async function fetchGitHubProfile(
  accessToken: string
): Promise<{ email: string; name: string; image: string }> {
  // Fetch GitHub user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!userRes.ok) {
    throw new Error('Failed to fetch GitHub user profile')
  }

  const profile: GitHubUserInfo = await userRes.json()

  let email = profile.email

  // If email is not public, fetch from the emails endpoint
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (emailsRes.ok) {
      const emails: GitHubEmail[] = await emailsRes.json()
      const primaryEmail = emails.find((e) => e.primary && e.verified)
      email = primaryEmail?.email || emails.find((e) => e.verified)?.email || null
    }
  }

  if (!email) {
    throw new Error('Could not retrieve email from GitHub')
  }

  return {
    email,
    name: profile.name || profile.login,
    image: profile.avatar_url,
  }
}

async function fetchUserProfile(
  provider: string,
  accessToken: string
): Promise<{ email: string; name: string; image: string }> {
  if (provider === 'google') {
    return fetchGoogleProfile(accessToken)
  }
  if (provider === 'github') {
    return fetchGitHubProfile(accessToken)
  }
  throw new Error(`Unsupported provider: ${provider}`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const normalizedProvider = provider.toLowerCase()

    if (!['google', 'github'].includes(normalizedProvider)) {
      return NextResponse.redirect(`${BASE_URL}/?social=error`)
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Verify state parameter for CSRF protection
    const cookieStore = request.headers.get('cookie') || ''
    const stateMatch = cookieStore.match(/(?:^|;\s*)oauth_state=([^;]*)/)
    const savedState = stateMatch?.[1]

    if (!state || !savedState || state !== savedState) {
      console.error('OAuth state mismatch or missing')
      return NextResponse.redirect(`${BASE_URL}/?social=error`)
    }

    if (!code) {
      console.error('Missing authorization code')
      return NextResponse.redirect(`${BASE_URL}/?social=error`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(normalizedProvider, code)
    const accessToken = tokenResponse.access_token

    if (!accessToken) {
      console.error('No access token in response')
      return NextResponse.redirect(`${BASE_URL}/?social=error`)
    }

    // Fetch user profile from the provider
    const profile = await fetchUserProfile(normalizedProvider, accessToken)

    // Find or create the user in our database
    const existingUser = await db.user.findUnique({
      where: { email: profile.email },
    })

    let user

    if (existingUser) {
      // Update the user's name and image if they've changed
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: profile.name || existingUser.name,
          image: profile.image || existingUser.image,
        },
      })
    } else {
      // Create a new user with a random secure password
      const randomPassword = randomUUID()
      const hashedPassword = await bcrypt.hash(randomPassword, 12)

      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          password: hashedPassword,
          image: profile.image,
          role: 'user',
          plan: 'free',
          clipsLimit: 5,
          clipsUsed: 0,
        },
      })
    }

    // Build redirect response with session cookie
    const response = NextResponse.redirect(`${BASE_URL}/?social=success`)

    // Set session cookie
    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    // Clear the oauth_state cookie
    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${BASE_URL}/?social=error`)
  }
}
