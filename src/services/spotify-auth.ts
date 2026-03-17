import { Capacitor } from '@capacitor/core';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI_WEB = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SPOTIFY_REDIRECT_URI_MOBILE = import.meta.env.VITE_SPOTIFY_REDIRECT_URI_SMARTPHONE;

function getRedirectUri(): string {
  return Capacitor.isNativePlatform() ? SPOTIFY_REDIRECT_URI_MOBILE : SPOTIFY_REDIRECT_URI_WEB;
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
}

function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function redirectToSpotifyAuth() {
  const codeVerifier  = generateRandomString(64);
  const codeChallenge = base64encode(await sha256(codeVerifier));
  window.localStorage.setItem('code_verifier', codeVerifier);

  const scope = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'user-library-modify',        // like/unlike brani
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',     // crea/modifica playlist pubbliche
    'playlist-modify-private',    // crea/modifica playlist private
  ].join(' ');

  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true',
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: authUrl });
    } catch { window.open(authUrl, '_system'); }
  } else {
    window.location.href = authUrl;
  }
}

export async function handleSpotifyCallback(code: string) {
  const codeVerifier = window.localStorage.getItem('code_verifier');
  if (!codeVerifier) throw new Error('Code verifier not found');

  const redirectUri = getRedirectUri();

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) throw new Error('Failed to exchange code for token');
  const data = await response.json();

  const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
  window.localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  window.localStorage.setItem('spotify_token_expires_at', String(expiresAt));
  window.localStorage.removeItem('code_verifier');

  return data.access_token;
}

export function getToken(): string | null {
  const token     = window.localStorage.getItem('spotify_access_token');
  const expiresAt = window.localStorage.getItem('spotify_token_expires_at');
  if (!token || !expiresAt) return null;
  if (Date.now() >= parseInt(expiresAt)) { clearToken(); return null; }
  return token;
}

export function clearToken() {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_token_expires_at');
}
