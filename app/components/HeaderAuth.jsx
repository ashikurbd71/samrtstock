'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import logo from '../../public/logo.png';
import Link from 'next/link';
export default function HeaderAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
    if (onLoginPage) {
      setLoggedIn(false);
      return;
    }
    // Check session via server (HttpOnly cookie is unreadable in JS)
    axios
      .get('/api/auth/session')
      .then(res => setLoggedIn(!!res.data?.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  const logout = async () => {
    setBusy(true);
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/login';
    } finally {
      setBusy(false);
    }
  };

  if (!loggedIn) return null;

  return (
    <header className="bg-gray-50 fixed top-0 left-0 right-0 z-50 text-gray-900 border-b border-gray-200 shadow-sm">
      <div className="w-full lg:px-8 mx-auto p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">

              <Link href="/">
                  <div className="flex cursor-pointer items-center gap-2 sm:gap-3">
          {/* Logo + brand */}
          <Image
            src={logo}
            alt="SmartStock logo"
            width={34}
            height={34}
            priority
            sizes="(max-width: 640px) 28px, 34px"
          />
          <span className="font-semibold text-sm sm:text-base md:text-lg tracking-wide">
            SMARTSTOCK
          </span>
        </div>
              </Link>
    
        <button
          onClick={logout}
          disabled={busy}
          className="px-3 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg cursor-pointer bg-red-600 text-white hover:bg-red-700 text-xs sm:text-sm md:text-base disabled:opacity-50"
        >
          {busy ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}