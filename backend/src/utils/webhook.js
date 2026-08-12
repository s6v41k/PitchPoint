// Best-effort integration point for external automation tools (Zapier,
// n8n, Make, ...). Callers fire an event ("booking.created", ...) and a
// JSON payload; if AUTOMATION_WEBHOOK_URL is configured, it's POSTed
// there. Nothing else in the app depends on this working.
//
// Deliberately not awaited by callers: a slow or unreachable webhook must
// never slow down or fail the user-facing request that triggered it, so
// failures are only logged, never thrown.
function notifyAutomation(event, data) {
  const url = process.env.AUTOMATION_WEBHOOK_URL;
  if (!url) return;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, data, sentAt: new Date().toISOString() }),
  }).catch((err) => {
    console.error(`Automation webhook (${event}) failed:`, err.message);
  });
}

module.exports = { notifyAutomation };
