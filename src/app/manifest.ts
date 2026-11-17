import { type MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Next Starter',
        short_name: 'Starter',
        description: 'A production-ready Next.js skeleton with working examples.',
        start_url: '/',
        display: 'standalone',
        // The one palette in globals.css (--background, Mono Brutal).
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon',
                sizes: '64x64',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
