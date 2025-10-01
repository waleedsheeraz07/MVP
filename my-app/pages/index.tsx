import Head from 'next/head'
import Link from 'next/link'
import { prisma } from '../lib/prisma'
import { useState } from 'react';
import Layout from "../components/header";
    
interface Product {
  id: string
  title: string
  description?: string
  price: number
  images: string[]
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  role: string;
}
  
interface Props {
  products: Product[];
  categories: Category[];
  user: User;
}

export default function Home({ products, categories, user }: Props) {
  const featuredProducts = products.slice(0, 4) // only 1-2 items
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Vintage Marketplace | Authentic Vintage Treasures</title>
        <meta name="description" content="Discover and sell authentic vintage items in our curated marketplace. From retro fashion to antique collectibles." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

<Layout categories={categories} user={user}>
     
      <main className="min-h-screen bg-[#fefaf5] text-[#3e2f25] font-sans overflow-hidden">

        {/* Desktop CTA */}
              <div className="hidden md:flex items-center space-x-4">
                <button className="bg-[#8b4513] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#6b3410] transition-colors">
                  Join Community
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu - Collapsible */}
          <div className={`md:hidden bg-white border-t border-[#e6d9c6] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a 
                href="#featured" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#fdf8f3] rounded-md transition-colors"
              >
                Shop
              </a>
              <a 
                href="#categories" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#fdf8f3] rounded-md transition-colors"
              >
                Categories
              </a>
              <a 
                href="#about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#fdf8f3] rounded-md transition-colors"
              >
                About
              </a>
              <a 
                href="#sell" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#fdf8f3] rounded-md transition-colors"
              >
                Sell
              </a>
              <div className="px-3 py-2">
                <button className="w-full bg-[#8b4513] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#6b3410] transition-colors">
                  Join Community
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Section - Mobile Optimized */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf8f3] to-[#e6d9c6] overflow-hidden pt-16">
          {/* Background decorative elements - Hidden on mobile for performance */}
          <div className="absolute inset-0 opacity-10 hidden sm:block">
            <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-[#8b4513] rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-40 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-[#d4b996] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-[#5a4436] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Discover <span className="text-[#8b4513] block sm:inline">Timeless</span> Treasures
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-2xl mx-auto text-[#5a4436] leading-relaxed px-4">
              Curated vintage pieces with stories to tell. Authenticity guaranteed, memories preserved.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
              <Link href="/buyer/products">
                <a className="w-full sm:w-auto bg-[#8b4513] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center">
                  Explore Collection
                </a>
              </Link>
              <Link href="/seller/products">
                <a className="w-full sm:w-auto bg-transparent text-[#8b4513] border-2 border-[#8b4513] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 text-center">
                  Start Selling
                </a>
              </Link>
            </div>
            
            {/* Trust indicators - Stack on mobile */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-sm text-[#5a4436]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Authenticity Verified</span>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-[#8b4513] rounded-full flex justify-center">
              <div className="w-1 h-2 sm:h-3 bg-[#8b4513] rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* Categories Section - Mobile Grid */}
        <section id="categories" className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">Shop by Category</h2>
            <p className="text-base sm:text-lg text-[#5a4436] text-center mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Explore our carefully curated vintage categories
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {['Fashion', 'Furniture', 'Jewelry', 'Art & Decor', 'Records', 'Cameras', 'Books', 'Collectibles'].map((category, index) => (
                <div key={category} className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#fdf8f3] to-[#e6d9c6] h-32 sm:h-40 lg:h-48 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3e2f25] z-10 transform transition-transform duration-500 group-hover:scale-110 text-center">
                      {category}
                    </h3>
                  </div>
                  <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 text-[#8b4513] font-medium text-xs sm:text-sm">
                    {Math.floor(Math.random() * 100) + 50} items
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products - Mobile Responsive Grid */}
        <section id="featured" className="py-12 sm:py-16 lg:py-20 bg-[#fefaf5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Featured Treasures</h2>
              <p className="text-base sm:text-lg text-[#5a4436] max-w-2xl mx-auto px-4">
                Handpicked vintage items with unique character and history
              </p>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl sm:hover:shadow-2xl transform transition-all duration-500 hover:scale-105 cursor-pointer"
                >
                  {/* Product Image with Overlay */}
                  <div className="relative overflow-hidden h-48 sm:h-60 lg:h-72 xl:h-80">
                    {product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    ) : (
                      <div className="bg-gradient-to-br from-[#e6d9c6] to-[#d4b996] w-full h-full flex items-center justify-center">
                        <span className="text-[#5a4436] text-sm sm:text-base">Image Coming Soon</span>
                      </div>
                    )}
                    
                    {/* Quick action buttons */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="bg-white/90 p-1 sm:p-2 rounded-full hover:bg-white transition-colors shadow-lg text-xs sm:text-base">
                        ♡
                      </button>
                    </div>
                    
                    {/* Category tag */}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <span className="bg-[#8b4513] text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                        Vintage
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#3e2f25] line-clamp-2 flex-1 pr-2">
                        {product.title}
                      </h3>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-[#8b4513] whitespace-nowrap">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-[#5a4436] text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {product.description || 'Beautiful vintage piece with character and history'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xs sm:text-sm">★</span>
                        ))}
                        <span className="text-xs sm:text-sm text-[#5a4436] ml-1">(24)</span>
                      </div>
                      <Link href={`/buyer/products/${product.id}`}>
                        <a className="bg-[#8b4513] text-white px-3 sm:px-4 lg:px-6 py-1 sm:py-2 rounded-full font-medium hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm">
                          View Details
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View All Button */}
            <div className="text-center mt-8 sm:mt-12">
              <Link href="/buyer/products">
                <a className="inline-flex items-center space-x-2 bg-transparent border-2 border-[#8b4513] text-[#8b4513] px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 text-sm sm:text-base">
                  <span>View All Products</span>
                  <span className="hidden sm:inline">→</span>
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section - Stack on mobile */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-[#8b4513] to-[#a0522d] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
              <div className="p-2 sm:p-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">50K+</div>
                <div className="text-[#fdf8f3] text-xs sm:text-sm lg:text-base">Vintage Items</div>
              </div>
              <div className="p-2 sm:p-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">25K+</div>
                <div className="text-[#fdf8f3] text-xs sm:text-sm lg:text-base">Happy Customers</div>
              </div>
              <div className="p-2 sm:p-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">98%</div>
                <div className="text-[#fdf8f3] text-xs sm:text-sm lg:text-base">Satisfaction Rate</div>
              </div>
              <div className="p-2 sm:p-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">15+</div>
                <div className="text-[#fdf8f3] text-xs sm:text-sm lg:text-base">Years Experience</div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Why Choose Us - Stack on mobile */}
        <section id="about" className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">Why Collectors Trust Us</h2>
            <p className="text-base sm:text-lg text-[#5a4436] text-center mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto px-4">
              We're passionate about preserving history and connecting people with meaningful pieces
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[
                {
                  icon: '🔍',
                  title: 'Expert Authentication',
                  description: 'Every item is verified by our team of vintage experts to ensure authenticity and quality.'
                },
                {
                  icon: '🛡️',
                  title: 'Secure Marketplace',
                  description: 'Protected transactions and buyer guarantees make shopping safe and worry-free.'
                },
                {
                  icon: '🌍',
                  title: 'Global Community',
                  description: 'Connect with vintage enthusiasts and collectors from around the world.'
                },
                {
                  icon: '🚚',
                  title: 'Careful Shipping',
                  description: 'Specialized packaging and handling to preserve your vintage treasures in transit.'
                },
                {
                  icon: '💬',
                  title: 'Personal Service',
                  description: 'Dedicated support team to help you find exactly what you\'re looking for.'
                },
                {
                  icon: '📜',
                  title: 'Rich Histories',
                  description: 'Learn the stories behind each piece and connect with its unique past.'
                }
              ].map((feature, index) => (
                <div key={index} className="text-center p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#fdf8f3] to-[#e6d9c6] transform transition-all duration-300 hover:scale-105 hover:shadow-lg sm:hover:shadow-xl">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-[#3e2f25]">{feature.title}</h3>
                  <p className="text-[#5a4436] leading-relaxed text-sm sm:text-base">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Sell Section - Mobile Optimized */}
        <section id="sell" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#8b4513] to-[#a0522d] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Share Your Vintage Treasures?</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4">
              Join thousands of sellers connecting their vintage pieces with passionate collectors worldwide.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {[
                { step: '1', title: 'List Your Items', desc: 'Easy upload with our seller dashboard' },
                { step: '2', title: 'We Authenticate', desc: 'Our experts verify your vintage pieces' },
                { step: '3', title: 'Connect & Sell', desc: 'Reach thousands of eager collectors' }
              ].map((item) => (
                <div key={item.step} className="bg-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-[#8b4513] rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mb-3 sm:mb-4 mx-auto">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm opacity-80">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
              <Link href="/seller/sell">
                <a className="w-full sm:w-auto bg-white text-[#8b4513] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold hover:bg-[#fdf8f3] transform hover:scale-105 transition-all duration-300 shadow-lg text-sm sm:text-base text-center">
                  Start Selling Today
                </a>
              </Link>
              <button className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold hover:bg-white hover:text-[#8b4513] transform hover:scale-105 transition-all duration-300 text-sm sm:text-base">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Newsletter Section - Mobile Optimized */}
        <section className="py-12 sm:py-16 bg-[#fdf8f3]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Stay in the Vintage Loop</h2>
            <p className="text-[#5a4436] mb-6 sm:mb-8 text-sm sm:text-base">
              Get weekly updates on new arrivals, exclusive deals, and vintage collecting tips
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full border border-[#d4b996] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent text-sm sm:text-base"
              />
              <button className="bg-[#8b4513] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 text-sm sm:text-base whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        {/* Enhanced Footer - Mobile Responsive */}
        <footer className="bg-[#2c1e14] text-[#fdf8f3] pt-12 sm:pt-16 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#d4b996]">VintageCurated</h3>
                <p className="text-[#e6d9c6] mb-3 sm:mb-4 text-sm sm:text-base">
                  Connecting collectors with authentic vintage treasures since 2010.
                </p>
                <div className="flex space-x-3 sm:space-x-4 flex-wrap">
                  {['Twitter', 'Instagram', 'Facebook', 'Pinterest'].map((social) => (
                    <a key={social} href="#" className="text-[#d4b996] hover:text-white transition-colors text-sm sm:text-base mb-2">
                      {social}
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-[#d4b996] text-sm sm:text-base">Shop</h4>
                <ul className="space-y-1 sm:space-y-2">
                  {['New Arrivals', 'Featured Items', 'On Sale', 'Collections', 'Gift Cards'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors text-sm sm:text-base">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-[#d4b996] text-sm sm:text-base">Support</h4>
                <ul className="space-y-1 sm:space-y-2">
                  {['Help Center', 'Shipping Info', 'Returns', 'Size Guide', 'Contact Us'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors text-sm sm:text-base">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-[#d4b996] text-sm sm:text-base">Company</h4>
                <ul className="space-y-1 sm:space-y-2">
                  {['About Us', 'Our Story', 'Sustainability', 'Careers', 'Press'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors text-sm sm:text-base">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="border-t border-[#5a4436] pt-6 sm:pt-8 text-center">
              <p className="text-[#e6d9c6] text-sm sm:text-base">
                &copy; {new Date().getFullYear()} VintageCurated Marketplace. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @media (max-width: 480px) {
          .text-4xl {
            font-size: 2rem;
            line-height: 2.5rem;
          }
          .text-5xl {
            font-size: 2.5rem;
            line-height: 3rem;
          }
        }
        
        /* Custom breakpoint for very small screens */
        @media (min-width: 475px) and (max-width: 639px) {
          .xs\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
</Layout>
    </>
  );
}



}

// ---------------- Server Side ----------------
export async function getServerSideProps() {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Fetch categories
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });
     
const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
    },
  })

  return {
    props: { products,
 categories,
      user: {
        id: session.user.id,
        name: session.user.name || user?.firstName || "Guest",
        role: session.user.role,
      },
},
  }
}