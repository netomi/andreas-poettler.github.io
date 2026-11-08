// Notification hook. SMTP is not wired up yet: until it is, events go to stdout
// so nothing is lost and the admin page remains the source of truth.
export async function notify(subject, text) {
  console.log(`[notify] ${subject}\n${text}`);
}
