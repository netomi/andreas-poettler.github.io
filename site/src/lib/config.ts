// Build-time switches (set via environment, see .github/workflows/pages.yml).
export const bookingEnabled = import.meta.env.PUBLIC_BOOKING !== 'off'; // forms stay visible but disabled when 'off'
export const apiBase = (import.meta.env.PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');
export const preview = import.meta.env.PUBLIC_PREVIEW === 'true'; // noindex, no canonical
