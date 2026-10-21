'use client';
import { usePathname } from 'next/navigation';
import GuestNavbar from './guest-navbar';
export default function RouteNavbar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === '/register' || /^\/events\/[^/]+$/.test(path) ? <GuestNavbar /> : children;
}
