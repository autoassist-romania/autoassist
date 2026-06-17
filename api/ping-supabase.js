export default async function handler(req, res) {
  try {
    const url = 'https://zspcknjuqdjfxtqrqhhm.supabase.co/rest/v1/';
    await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
      }
    });
    res.status(200).json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
