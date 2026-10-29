import {ACCOUNT_CONFIG as config} from './config.js';
let pending;

export function accountClient() {
  if (!pending) pending = initialize().catch(error => { pending = null; throw error; });
  return pending;
}

async function initialize() {
  if (!globalThis.supabase?.createClient) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(config.sdkPath, import.meta.url).href;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('The secure account tools could not load. Please retry.')); };
      document.head.append(script);
    });
  }
  return globalThis.supabase.createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      storageKey: config.storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: { fetch: (url, options = {}) => fetch(url, {
      ...options,
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(String(url).includes('/functions/v1/nav-account-entry') ? 25000 : 12000)]) : AbortSignal.timeout(String(url).includes('/functions/v1/nav-account-entry') ? 25000 : 12000)
    }) }
  });
}
