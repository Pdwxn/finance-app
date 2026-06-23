import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance App',
    short_name: 'Finance',
    description: 'Personal finance manager - offline first',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a84ff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
