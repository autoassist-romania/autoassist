export const config = { runtime: 'edge' };

export default async function handler(req) {
  const res = await fetch(
    `https://zspcknjuqdjfxtqrqhhm.supabase.co/functions/v1/sync-automobilus`
  );
  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
