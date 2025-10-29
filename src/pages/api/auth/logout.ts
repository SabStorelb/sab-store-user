import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Clear cookie
  const cookie = `sb_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`;
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
