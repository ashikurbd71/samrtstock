import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  // Clear the auth cookie
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}