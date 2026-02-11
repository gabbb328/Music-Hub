const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-recently-played",
  "user-top-read",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "streaming",
  "user-read-email",
  "user-read-private",
].join(" ");

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

// Generate random string for PKCE
function generateRandomString(length: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// Create SHA256 hash
async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Base64 encode
function base64encode(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export const getAuthUrl = async () => {
  // Generate code verifier and challenge for PKCE
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Store code verifier for later use
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
};

// Fallback to Implicit Grant Flow (for older apps)
export const getAuthUrlImplicit = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "token",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
};

export const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial: { [key: string]: string }, item) => {
      const parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

export const getCodeFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

export const exchangeCodeForToken = async (code: string) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  
  // Clean up code verifier
  localStorage.removeItem('spotify_code_verifier');
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
};

export const setToken = (token: string) => {
  localStorage.setItem("spotify_token", token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem("spotify_refresh_token", token);
};

export const getToken = () => {
  return localStorage.getItem("spotify_token");
};

export const getRefreshToken = () => {
  return localStorage.getItem("spotify_refresh_token");
};

export const removeToken = () => {
  localStorage.removeItem("spotify_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_token_expires_at");
  localStorage.removeItem("spotify_code_verifier");
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  const expiresAt = localStorage.getItem("spotify_token_expires_at");
  if (!expiresAt) return false;

  return new Date().getTime() < parseInt(expiresAt);
};

export const setTokenExpiry = (expiresIn: string | number) => {
  const expiresInSeconds = typeof expiresIn === 'string' ? parseInt(expiresIn) : expiresIn;
  const expiresAt = new Date().getTime() + expiresInSeconds * 1000;
  localStorage.setItem("spotify_token_expires_at", expiresAt.toString());
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  
  setToken(data.access_token);
  setTokenExpiry(data.expires_in);
  
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  
  return data.access_token;
};
