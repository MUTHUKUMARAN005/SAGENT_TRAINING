const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '170974852398-itcrqkkks2sv6r39u1inuqtf1pcafdm7.apps.googleusercontent.com';

let googleScriptPromise;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), {
        once: true,
      });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Sign-In script.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error('Failed to load Google Sign-In script.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const signInWithGoogle = async () => {
  const google = await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID is missing.'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        try {
          const profileResponse = await fetch(
            'https://openidconnect.googleapis.com/v1/userinfo',
            {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            }
          );

          if (!profileResponse.ok) {
            throw new Error('Unable to fetch Google profile.');
          }

          const profile = await profileResponse.json();
          resolve({
            sub: profile.sub,
            name: profile.name || profile.given_name || 'Google User',
            email: profile.email || '',
            picture: profile.picture || '',
          });
        } catch (error) {
          reject(error);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
};

export { GOOGLE_CLIENT_ID };
