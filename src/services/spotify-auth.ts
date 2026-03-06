import { Capacitor } from '@capacitor/core';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI_WEB = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_REDIRECT_URI_MOBILE = import.meta.env.VITE_SPOTIFY_REDIRECT_URI_SMARTPHONE;

// Determina il redirect URI in base alla piattaforma
function getRedirectUri(): string {
  const isNative = Capacitor.isNativePlatform();
  return isNative ? SPOTIFY_REDIRECT_URI_MOBILE : SPOTIFY_REDIRECT_URI_WEB;
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function redirectToSpotifyAuth() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  window.localStorage.setItem('code_verifier', codeVerifier);

  const scope = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  const redirectUri = getRedirectUri();
  console.log('Using redirect URI:', redirectUri);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  // Su mobile, apre il browser esterno
  if (Capacitor.isNativePlatform()) {
    try {
      // Import dinamico del plugin Browser
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: authUrl });
    } catch (error) {
      // Fallback: usa window.open
      window.open(authUrl, '_system');
    }
  } else {
    window.location.href = authUrl;
  }
}

export async function handleSpotifyCallback(code: string) {
  const codeVerifier = window.localStorage.getItem('code_verifier');

  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();
  
  // Ensure we have a valid expires_in, default to 1 hour (3600s) if missing
  const expiresIn = data.expires_in || 3600;
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  console.log('Token data received:', { 
    has_access: !!data.access_token, 
    has_refresh: !!data.refresh_token, 
    expires_in: expiresIn 
  });

  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  window.localStorage.setItem('spotify_token_expires_at', String(expiresAt));
  window.localStorage.removeItem('code_verifier');

  return data.access_token;
}

export function getToken(): string | null {
  const token = window.localStorage.getItem('spotify_access_token');
  const expiresAt = window.localStorage.getItem('spotify_token_expires_at');

  if (!token || !expiresAt) {
    return null;
  }

  if (Date.now() >= parseInt(expiresAt)) {
    clearToken();
    return null;
  }

  return token;
}

export function clearToken() {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_token_expires_at');
}
