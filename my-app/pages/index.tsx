import Head from 'next/head'
import Image from 'next/image'
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
  return (
    <>
      <Head>
        <title>Vintage Treasures</title>
        <meta name="description" content="Discover rare and authentic vintage items" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-[#fdf8f3] text-[#4e342e]">
        {/* Hero Section */}
        <section className="relative bg-[#d4b996] py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[#3e2f25]">
            Welcome to Vintage Treasures
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Handpicked, authentic vintage items for collectors and enthusiasts.
          </p>
          <Link href="/products">
            <a className="bg-[#3e2f25] text-[#fdf8f3] px-6 py-3 rounded-lg font-semibold hover:bg-[#5a4436] transition">
              Browse Collection
            </a>
          </Link>
        </section>

        {/* Products Grid */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Featured Vintage Items
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-[#fffdfb] shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition">
                <div className="relative w-full h-64">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg md:text-xl font-semibold mb-1">{product.title}</h3>
                  <p className="text-[#b58b5a] font-bold">${product.price}</p>
                  <Link href={`/products/${product.id}`}>
                    <a className="mt-3 inline-block bg-[#3e2f25] text-[#fdf8f3] px-4 py-2 rounded hover:bg-[#5a4436] transition">
                      View Details
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#3e2f25] text-[#fdf8f3] py-10 text-center">
          <p>&copy; {new Date().getFullYear()} Vintage Treasures. All rights reserved.</p>
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