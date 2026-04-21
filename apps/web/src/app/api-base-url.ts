const GLOBAL_KEY = '__MC_API_BASE_URL__';

declare global {
  interface Window {
    [GLOBAL_KEY]?: string;
  }
}

export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const fromWindow = window[GLOBAL_KEY];
    if (typeof fromWindow === 'string' && fromWindow.length > 0) {
      return fromWindow;
    }
    const meta = document.querySelector<HTMLMetaElement>('meta[name="mc-api-base-url"]');
    const fromMeta = meta?.content?.trim();
    if (fromMeta) {
      return fromMeta;
    }
    return window.location.origin;
  }
  return '';
}
