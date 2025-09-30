
import Head from 'next/head'
import Link from 'next/link'
import { prisma } from '../lib/prisma'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  images: string[]
}

interface Props {
  products: Product[]
}

export default function Home({ products }: Props) {
  const featuredProducts = products.slice(0, 4) // only 1-2 items

return (
  <>
    <Head>
      <title>Vintage Marketplace | Authentic Vintage Treasures</title>
      <meta name="description" content="Discover and sell authentic vintage items in our curated marketplace. From retro fashion to antique collectibles." />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className="min-h-screen bg-[#fefaf5] text-[#3e2f25] font-sans overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-[#e6d9c6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#8b4513]">VintageCurated</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#featured" className="text-[#5a4436] hover:text-[#8b4513] transition-colors font-medium">Shop</a>
              <a href="#categories" className="text-[#5a4436] hover:text-[#8b4513] transition-colors font-medium">Categories</a>
              <a href="#about" className="text-[#5a4436] hover:text-[#8b4513] transition-colors font-medium">About</a>
              <a href="#sell" className="text-[#5a4436] hover:text-[#8b4513] transition-colors font-medium">Sell</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-[#8b4513] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#6b3410] transition-colors">
                Join Community
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient(135deg, #fdf8f3 0%, #e6d9c6 100%) overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#8b4513] rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-[#d4b996] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-[#5a4436] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Discover <span className="text-[#8b4513]">Timeless</span> Treasures
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto text-[#5a4436] leading-relaxed">
            Curated vintage pieces with stories to tell. Authenticity guaranteed, memories preserved.
          </p>
          <div className="flex justify-center flex-wrap gap-4 mb-12">
            <Link href="/buyer/products">
              <a className="bg-[#8b4513] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                Explore Collection
              </a>
            </Link>
            <Link href="/seller/products">
              <a className="bg-transparent text-[#8b4513] border-2 border-[#8b4513] px-8 py-4 rounded-full font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300">
                Start Selling
              </a>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex justify-center items-center space-x-8 text-sm text-[#5a4436]">
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#8b4513] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#8b4513] rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Shop by Category</h2>
          <p className="text-lg text-[#5a4436] text-center mb-12 max-w-2xl mx-auto">
            Explore our carefully curated vintage categories
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Fashion', 'Furniture', 'Jewelry', 'Art & Decor', 'Records', 'Cameras', 'Books', 'Collectibles'].map((category, index) => (
              <div key={category} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fdf8f3] to-[#e6d9c6] h-48 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-[#3e2f25] z-10 transform transition-transform duration-500 group-hover:scale-110">
                    {category}
                  </h3>
                </div>
                <div className="absolute bottom-4 left-4 text-[#8b4513] font-medium">
                  {Math.floor(Math.random() * 100) + 50} items
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Enhanced */}
      <section id="featured" className="py-20 bg-[#fefaf5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Treasures</h2>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Handpicked vintage items with unique character and history
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 cursor-pointer"
              >
                {/* Product Image with Overlay */}
                <div className="relative overflow-hidden h-80">
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
                      <span className="text-[#5a4436]">Image Coming Soon</span>
                    </div>
                  )}
                  
                  {/* Quick action buttons */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors shadow-lg">
                      ♡
                    </button>
                  </div>
                  
                  {/* Category tag */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#8b4513] text-white px-3 py-1 rounded-full text-xs font-medium">
                      Vintage
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-[#3e2f25] line-clamp-2 flex-1">
                      {product.title}
                    </h3>
                    <span className="text-2xl font-bold text-[#8b4513] ml-4">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-[#5a4436] text-sm mb-4 line-clamp-2">
                    {product.description || 'Beautiful vintage piece with character and history'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                      <span className="text-sm text-[#5a4436] ml-1">(24)</span>
                    </div>
                    <Link href={`/buyer/products/${product.id}`}>
                      <a className="bg-[#8b4513] text-white px-6 py-2 rounded-full font-medium hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 text-sm">
                        View Details
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* View All Button */}
          <div className="text-center mt-12">
            <Link href="/buyer/products">
              <a className="inline-flex items-center space-x-2 bg-transparent border-2 border-[#8b4513] text-[#8b4513] px-8 py-3 rounded-full font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300">
                <span>View All Products</span>
                <span>→</span>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#8b4513] to-[#a0522d] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-[#fdf8f3]">Vintage Items</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25K+</div>
              <div className="text-[#fdf8f3]">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-[#fdf8f3]">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-[#fdf8f3]">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Why Collectors Trust Us</h2>
          <p className="text-lg text-[#5a4436] text-center mb-16 max-w-2xl mx-auto">
            We're passionate about preserving history and connecting people with meaningful pieces
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div key={index} className="text-center p-8 rounded-2xl bg-gradient-to-br from-[#fdf8f3] to-[#e6d9c6] transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-[#3e2f25]">{feature.title}</h3>
                <p className="text-[#5a4436] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Sell Section */}
      <section id="sell" className="py-20 bg-gradient-to-br from-[#8b4513] to-[#a0522d] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Share Your Vintage Treasures?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of sellers connecting their vintage pieces with passionate collectors worldwide.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { step: '1', title: 'List Your Items', desc: 'Easy upload with our seller dashboard' },
              { step: '2', title: 'We Authenticate', desc: 'Our experts verify your vintage pieces' },
              { step: '3', title: 'Connect & Sell', desc: 'Reach thousands of eager collectors' }
            ].map((item) => (
              <div key={item.step} className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                <div className="w-12 h-12 bg-white text-[#8b4513] rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center flex-wrap gap-4">
            <Link href="/seller/sell">
              <a className="bg-white text-[#8b4513] px-8 py-4 rounded-full font-bold hover:bg-[#fdf8f3] transform hover:scale-105 transition-all duration-300 shadow-lg">
                Start Selling Today
              </a>
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-[#8b4513] transform hover:scale-105 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-[#fdf8f3]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Vintage Loop</h2>
          <p className="text-[#5a4436] mb-8">
            Get weekly updates on new arrivals, exclusive deals, and vintage collecting tips
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-[#d4b996] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent"
            />
            <button className="bg-[#8b4513] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-[#2c1e14] text-[#fdf8f3] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-[#d4b996]">VintageCurated</h3>
              <p className="text-[#e6d9c6] mb-4">
                Connecting collectors with authentic vintage treasures since 2010.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'Instagram', 'Facebook', 'Pinterest'].map((social) => (
                  <a key={social} href="#" className="text-[#d4b996] hover:text-white transition-colors">
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#d4b996]">Shop</h4>
              <ul className="space-y-2">
                {['New Arrivals', 'Featured Items', 'On Sale', 'Collections', 'Gift Cards'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#d4b996]">Support</h4>
              <ul className="space-y-2">
                {['Help Center', 'Shipping Info', 'Returns', 'Size Guide', 'Contact Us'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-[#d4b996]">Company</h4>
              <ul className="space-y-2">
                {['About Us', 'Our Story', 'Sustainability', 'Careers', 'Press'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[#e6d9c6] hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#5a4436] pt-8 text-center">
            <p className="text-[#e6d9c6]">
              &copy; {new Date().getFullYear()} VintageCurated Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  </>
);
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
    },
  })

  return {
    props: { products },
  }
}