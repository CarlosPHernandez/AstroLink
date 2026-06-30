import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#1c1c1c',
  colorScheme: 'dark',
};

export default function TalkWithChrisLayout({ children }: { children: React.ReactNode }) {
  return children;
}