import { type MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Next Starter',
        short_name: 'Starter',
        description: 'A production-ready Next.js skeleton with working examples.',
        start_url: '/',
        display: 'standalone',
        // The light palette in globals.css (--background).
        background_color: '#ffffff',
        theme_color: '#ffffff',
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
