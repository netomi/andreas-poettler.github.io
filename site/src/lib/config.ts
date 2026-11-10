// Build-time settings, all PUBLIC_* (visible in the page by design). Set as GitHub repository variables, see .github/workflows/pages.yml.
// Unset values keep the corresponding feature in "preview" mode: visible but disabled.
const env = import.meta.env;

/** Cal.com booking link, e.g. 'andreas-poettler/probestunde'. Lessons are booked in the embedded Cal.com calendar. */
export const calLink: string = (env.PUBLIC_CAL_LINK ?? '').replace(/^\/+|\/+$/g, '');
export const bookingEnabled = calLink !== '';

/** Form-to-email service for book orders (Web3Forms). The access key identifies the recipient mailbox and is public by design. */
export const formEndpoint: string = env.PUBLIC_FORM_ENDPOINT ?? 'https://api.web3forms.com/submit';
export const formKey: string = env.PUBLIC_FORM_KEY ?? '';
export const ordersEnabled = formKey !== '';

export const preview = env.PUBLIC_PREVIEW === 'true'; // noindex, no canonical
