export const config = { runtime: 'edge' };

export default async function handler(req) {
  const full = new URL(req.url).searchParams.get('full') === '1';
  const res = await fetch(
    `https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/sync-fuel-prices${full ? '?full=1' : ''}`
  );
  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
