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
        <title>Vintage Marketplace</title>
        <meta name="description" content="Buy and sell authentic vintage items" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

<main className="min-h-screen bg-[#fdf8f3] text-[#3e2f25] font-sans">

  {/* Hero Section */}
  <section className="py-24 text-center bg-[#d4b996]">
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Vintage Marketplace</h1>
    <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
      Discover, buy, and sell authentic vintage items with ease.
    </p>
    <div className="flex justify-center flex-wrap gap-4">
      <Link href="/buyer/products">
        <a className="bg-[#3e2f25] text-[#fdf8f3] px-6 py-3 rounded-lg font-semibold hover:bg-[#5a4436] transition">
          Shop Now
        </a>
      </Link>
      <Link href="/seller/products">
        <a className="bg-[#fdf8f3] text-[#3e2f25] border-2 border-[#3e2f25] px-6 py-3 rounded-lg font-semibold hover:bg-[#3e2f25] hover:text-[#fdf8f3] transition">
          Sell Now
        </a>
      </Link>
    </div>
  </section>

{/* Featured Products */}
<section className="py-20 max-w-6xl mx-auto px-4">
  <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
    Featured Items
  </h2>

  {/* Responsive grid: 2 on mobile, 4 on large screens */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
    {featuredProducts.map((product) => (
      <div
        key={product.id}
        className=" cursor-pointer group bg-[#fffdfb] shadow-md rounded-2xl overflow-hidden flex flex-col transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
      >
        {/* Product Image */}
        <div className="w-full h-56 sm:h-64 md:h-72 relative overflow-hidden">
          {product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-105"
            />
          ) : (
            <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-[#3e2f25] truncate mb-2">
            {product.title}
          </h3>
          <p className="text-[#5a4436] font-bold mb-2">
            ${product.price.toFixed(2)}
          </p>

          <Link href={`/buyer/products/${product.id}`}>
            <a className="inline-block bg-[#3e2f25] text-[#fdf8f3] px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-[#5a4436] hover:shadow-md hover:scale-105 active:scale-95 self-start">
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
    <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Vision</h2>
    <p className="max-w-3xl mx-auto text-lg sm:text-xl">
      To create a safe and trusted marketplace for vintage enthusiasts, connecting sellers and buyers with authenticity and care.
    </p>
  </section>

  {/* Why Choose Us */}
  <section className="py-20 max-w-6xl mx-auto px-4">
    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose Us</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
      <div className="p-6 bg-[#fffdfb] shadow rounded-2xl">
        <h3 className="font-semibold text-xl mb-2">Authenticity</h3>
        <p>Every item is verified to ensure it is truly vintage.</p>
      </div>
      <div className="p-6 bg-[#fffdfb] shadow rounded-2xl">
        <h3 className="font-semibold text-xl mb-2">Secure Transactions</h3>
        <p>Safe and easy buying & selling experience for everyone.</p>
      </div>
      <div className="p-6 bg-[#fffdfb] shadow rounded-2xl">
        <h3 className="font-semibold text-xl mb-2">Community</h3>
        <p>Connect with other vintage collectors and sellers worldwide.</p>
      </div>
    </div>
  </section>

  {/* Sell Your Items */}
  <section className="py-20 bg-[#d4b996] text-center">
    <h2 className="text-3xl sm:text-4xl font-bold mb-6">Want to Sell Your Vintage Items?</h2>
    <p className="mb-6 max-w-2xl mx-auto">
      Join our marketplace today and reach thousands of vintage enthusiasts.
    </p>
    <Link href="/seller/sell">
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