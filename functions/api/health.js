export function onRequestGet() {
  return new Response(
    JSON.stringify({ ok: true, service: 'kurdistan-info-map-pages-functions' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  );
}
