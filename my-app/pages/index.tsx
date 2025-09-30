import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '../lib/prisma'
import { useState, useEffect } from 'react'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  images: string[]
  category?: string
}

interface Props {
  products: Product[]
}

export default function Home({ products }: Props) {
  const featuredProducts = products.slice(0, 4)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <Head>
        <title>Vintage Marketplace | Authentic Vintage Treasures</title>
        <meta name="description" content="Discover, buy, and sell authentic vintage items with guaranteed authenticity and secure transactions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 text-vintage-900 font-sans overflow-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="text-2xl font-serif font-bold text-amber-900 hover:text-amber-700 transition-colors">
                VintageCurated
              </Link>
              <div className="flex items-center space-x-8">
                <Link href="/buyer/products" className="text-amber-900 hover:text-amber-700 font-medium transition-colors">
                  Shop
                </Link>
                <Link href="/seller/products" className="text-amber-900 hover:text-amber-700 font-medium transition-colors">
                  Sell
                </Link>
                <Link href="/about" className="text-amber-900 hover:text-amber-700 font-medium transition-colors">
                  About
                </Link>
                <Link href="/seller/sell" className="bg-amber-900 text-amber-50 px-6 py-2 rounded-full font-medium hover:bg-amber-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-amber-900/25">
                  List Item
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-rose-900/10"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
          
          <div className={`relative z-10 text-center max-w-4xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-900 via-rose-800 to-amber-900 bg-clip-text text-transparent">
                Vintage
              </span>
              <br />
              <span className="text-amber-700">Rediscovered</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-amber-800/80 mb-8 font-light max-w-3xl mx-auto leading-relaxed">
              Where every piece tells a story. Discover authentic vintage treasures with guaranteed provenance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
              <Link href="/buyer/products" className="group relative bg-amber-900 text-amber-50 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-800 transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-amber-900/30 overflow-hidden">
                <span className="relative z-10">Explore Collection</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-800 to-rose-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              <Link href="/seller/products" className="group border-2 border-amber-900 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-900 hover:text-amber-50 transition-all duration-500 transform hover:scale-105">
                Start Selling
              </Link>
            </div>
            <div className="flex justify-center items-center space-x-8 text-amber-700/70">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm">Vintage Items</div>
              </div>
              <div className="w-1 h-8 bg-amber-300 rounded-full"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">5K+</div>
                <div className="text-sm">Happy Collectors</div>
              </div>
              <div className="w-1 h-8 bg-amber-300 rounded-full"></div>
              <div className="text-center">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm">Authenticity</div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-amber-900 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-amber-900 rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-900 to-rose-800 bg-clip-text text-transparent">
                Curated Collection
              </span>
            </h2>
            <p className="text-xl text-amber-800/70 max-w-2xl mx-auto leading-relaxed">
              Handpicked vintage treasures, each with its own unique story and character
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Product Image */}
                <div className="relative h-80 overflow-hidden">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
                      <div className="text-amber-900/40 text-lg">No Image</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-amber-900 text-amber-50 px-3 py-1 rounded-full text-sm font-medium">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-amber-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-amber-700/70 text-sm mb-4 line-clamp-2">
                    {product.description || `A beautiful vintage piece waiting for a new home`}
                  </p>
                  
                  <Link href={`/buyer/products/${product.id}`} className="inline-flex items-center justify-center w-full bg-amber-900 text-amber-50 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:bg-amber-800 hover:shadow-lg hover:scale-105 group/btn">
                    <span>View Details</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/buyer/products" className="inline-flex items-center text-amber-900 hover:text-amber-700 font-semibold text-lg group">
              View All Treasures
              <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-20 bg-gradient-to-br from-amber-900 to-rose-900 text-amber-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                Why Choose VintageCurated?
              </h2>
              <p className="text-xl text-amber-100/80 max-w-3xl mx-auto">
                We&apos;re revolutionizing the way you discover and collect vintage treasures
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: `🔍`,
                  title: `Expert Authentication`,
                  description: `Every item is verified by our team of vintage experts to ensure authenticity and quality.`
                },
                {
                  icon: `🛡️`,
                  title: `Secure Transactions`,
                  description: `Shop with confidence using our protected payment system and buyer guarantees.`
                },
                {
                  icon: `🌍`,
                  title: `Global Community`,
                  description: `Connect with collectors and enthusiasts from around the world who share your passion.`
                }
              ].map((item, index) => (
                <div key={index} className="text-center p-8 bg-white/10 rounded-3xl backdrop-blur-sm hover:bg-white/15 transition-all duration-500 transform hover:-translate-y-2">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-amber-100/80 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-rose-50"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Start Your <span className="text-amber-700">Vintage Journey</span>?
            </h2>
            <p className="text-xl text-amber-800/70 mb-8 max-w-2xl mx-auto">
              Join thousands of collectors and sellers in our curated vintage marketplace
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Link href="/seller/sell" className="group bg-amber-900 text-amber-50 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-800 transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-amber-900/30">
                Start Selling Today
              </Link>
              <Link href="/about" className="group border-2 border-amber-900 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-900 hover:text-amber-50 transition-all duration-500">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gradient-to-br from-amber-900 to-rose-900 text-amber-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <Link href="/" className="text-3xl font-serif font-bold text-amber-50 hover:text-amber-200 transition-colors">
                  VintageCurated
                </Link>
                <p className="mt-4 text-amber-100/80 max-w-md leading-relaxed">
                  Your trusted marketplace for authentic vintage treasures. Connecting collectors with timeless pieces since 2024.
                </p>
                <div className="flex space-x-4 mt-6">
                  {[`Twitter`, `Instagram`, `Pinterest`].map((social) => (
                    <a key={social} href="#" className="w-10 h-10 bg-amber-800/30 rounded-full flex items-center justify-center hover:bg-amber-700/50 transition-colors">
                      <span className="text-sm font-medium">{social[0]}</span>
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  {[`Shop Vintage`, `Sell Items`, `About Us`, `Authentication`].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-amber-100/80 hover:text-amber-200 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  {[`Help Center`, `Shipping Info`, `Returns`, `Contact`].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-amber-100/80 hover:text-amber-200 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="border-t border-amber-800 mt-12 pt-8 text-center text-amber-100/60">
              <p>&copy; {new Date().getFullYear()} VintageCurated Marketplace. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}

// ---------------- Server Side ----------------
export async function getServerSideProps() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
      category: true,
    },
  })

  return {
    props: { products },
  }
}