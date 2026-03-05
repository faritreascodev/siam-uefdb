/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    experimental: {
        serverActions: {
            enabled: true,
        },
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
