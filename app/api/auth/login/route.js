import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json();
  const email = (body?.email || '').trim();
  const password = (body?.password || '').trim();

  // Static credentials as requested
  const validEmail = 'smartstock@gmail.com';
  const validPassword = '123456';

  if (email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  // Set an HTTP-only cookie to mark the session
  res.cookies.set('auth_token', 'smartstock', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return res;
}