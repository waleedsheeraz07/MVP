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
  const featuredProducts = products.slice(0, 2) // only 1-2 items

  return (
    <>
      <Head>
        <title>Vintage Marketplace</title>
        <meta name="description" content="Buy and sell authentic vintage items" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-[#fdf8f3] text-[#4e342e] font-sans">

        {/* Hero */}
        <section className="py-24 text-center bg-[#d4b996]">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Vintage Marketplace</h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Discover, buy, and sell authentic vintage items with ease.
          </p>
          <div className="space-x-4">
            <Link href="/products">
              <a className="bg-[#3e2f25] text-[#fdf8f3] px-6 py-3 rounded-lg font-semibold hover:bg-[#5a4436] transition">
                Shop Now
              </a>
            </Link>
            <Link href="/sell">
              <a className="bg-[#fdf8f3] text-[#3e2f25] border-2 border-[#3e2f25] px-6 py-3 rounded-lg font-semibold hover:bg-[#3e2f25] hover:text-[#fdf8f3] transition">
                Sell Now
              </a>
            </Link>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Featured Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredProducts.map(product => (
              <div key={product.id} className="bg-[#fffdfb] shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition">
                <div className="w-full h-80 relative">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-1">{product.title}</h3>
                  <p className="text-[#b58b5a] font-bold mb-2">${product.price}</p>
                  <Link href={`/products/${product.id}`}>
                    <a className="inline-block bg-[#3e2f25] text-[#fdf8f3] px-4 py-2 rounded hover:bg-[#5a4436] transition">
                      View Product
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Vision */}
        <section className="py-20 bg-[#e6d9c6] text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Vision</h2>
          <p className="max-w-3xl mx-auto text-lg md:text-xl">
            To create a safe and trusted marketplace for vintage enthusiasts, connecting sellers and buyers with authenticity and care.
          </p>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-[#fffdfb] shadow rounded-lg">
              <h3 className="font-semibold text-xl mb-2">Authenticity</h3>
              <p>Every item is verified to ensure it is truly vintage.</p>
            </div>
            <div className="p-6 bg-[#fffdfb] shadow rounded-lg">
              <h3 className="font-semibold text-xl mb-2">Secure Transactions</h3>
              <p>Safe and easy buying & selling experience for everyone.</p>
            </div>
            <div className="p-6 bg-[#fffdfb] shadow rounded-lg">
              <h3 className="font-semibold text-xl mb-2">Community</h3>
              <p>Connect with other vintage collectors and sellers worldwide.</p>
            </div>
          </div>
        </section>

        {/* Sell Your Items */}
        <section className="py-20 bg-[#d4b996] text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Want to Sell Your Vintage Items?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join our marketplace today and reach thousands of vintage enthusiasts.
          </p>
          <Link href="/sell">
            <a className="bg-[#3e2f25] text-[#fdf8f3] px-6 py-3 rounded-lg font-semibold hover:bg-[#5a4436] transition">
              Sell Now
            </a>
          </Link>
        </section>

        {/* Footer */}
        <footer className="bg-[#3e2f25] text-[#fdf8f3] py-10 text-center">
          <p>&copy; {new Date().getFullYear()} Vintage Marketplace. All rights reserved.</p>
        </footer>
      </main>
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
    },
  })

  return {
    props: { products },
  }
}