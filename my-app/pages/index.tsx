import { signOut } from "next-auth/react"
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

const products = [
  { id: 1, name: 'Gold Ring', price: 120, image: '/gold-ring.jpg' },
  { id: 2, name: 'Silver Necklace', price: 80, image: '/silver-necklace.jpg' },
  { id: 3, name: 'Diamond Earrings', price: 200, image: '/diamond-earrings.jpg' },
]

export default function Home() {
  return (
    <>
      <Head>
        <title>Captain&apos;s Jewelry Store</title>
        <meta name="description" content="Premium jewelry for every occasion" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <button onClick={() => signOut({ callbackUrl: "/" })}>Logout</button>

        {/* Hero Section */}
        <section className="relative bg-yellow-100 py-20 text-center">
          <h1 className="text-5xl font-bold text-yellow-900 mb-4">Welcome to Captain&apos;s Jewelry</h1>
          <p className="text-xl text-yellow-800 mb-8">
            Discover the finest quality jewelry crafted just for you.
          </p>
          <Link href="/products">
            <a className="bg-yellow-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-800 transition">
              Shop Now
            </a>
          </Link>
        </section>

        {/* Products Section */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Bestsellers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-yellow-900 font-bold">${product.price}</p>
                  <Link href={`/products/${product.id}`}>
                    <a className="mt-4 inline-block bg-yellow-900 text-white px-4 py-2 rounded hover:bg-yellow-800 transition">
                      View
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-10 text-center">
          <p>&copy; {new Date().getFullYear()} Captain&apos;s Jewelry. All rights reserved.</p>
        </footer>
      </main>
    </>
  )
}