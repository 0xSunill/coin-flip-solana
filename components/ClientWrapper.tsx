// components/ClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const Nav = dynamic(() => import('./Nav'), { ssr: false });

export default function ClientWrapper() {
  return <Nav />;
}
