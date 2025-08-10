/** @type {import('next').NextConfig} */
const nextConfig = {
  // 性能优化配置
  reactStrictMode: true,
  swcMinify: true,
  
  // 启用实验性功能以提高性能
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  
  // 编译器优化 (Turbopack 不支持 compiler.removeConsole)
  // 在生产构建时手动处理 console 移除
  ...(process.env.NODE_ENV === 'production' && !process.env.TURBOPACK && {
    compiler: {
      removeConsole: true,
    },
  }),
  
  // 图片优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 开发环境下的 Hot Reload 配置
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
      
      config.optimization = {
        ...config.optimization,
        providedExports: false,
        usedExports: false,
        sideEffects: false,
      }
    }
    
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
        usedExports: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return []
    }
    const backend = process.env.NEXT_PUBLIC_API_URL
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/:path*`,
      },
    ]
  },
  
  // 静态资源优化
  poweredByHeader: false,
  generateEtags: false,
  
  // 输出优化
  output: 'standalone',
}

module.exports = nextConfig