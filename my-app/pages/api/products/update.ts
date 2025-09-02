import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../lib/prisma"
import cloudinary from "../../../lib/cloudinary"
import formidable, { File, Files, Fields } from "formidable"
import fs from "fs"

export const config = { api: { bodyParser: false } }

interface FormFields {
  title: string
  description?: string
  price: string
  quantity: string
  colors?: string[]
  sizes?: string[]
  categories?: string[]
  condition?: string
  era?: string
  existingImages?: string[]
}

const normalizeField = (field?: string | string[]): string[] =>
  !field ? [] : Array.isArray(field) ? field.map(String) : [String(field)]

const splitComma = (field?: string[]): string[] =>
  field?.flatMap(f => f.split(",").map(s => s.trim())) || []

const parseForm = (req: NextApiRequest): Promise<{ fields: FormFields; files: File[] }> =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: true })
    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) return reject(err)

      const uploadedFiles: File[] = []
      if (files.images) {
        if (Array.isArray(files.images)) uploadedFiles.push(...(files.images as File[]))
        else uploadedFiles.push(files.images as File)
      }

      const safeFields: FormFields = {
        title: fields.title?.toString() || "",
        description: fields.description?.toString(),
        price: fields.price?.toString() || "0",
        quantity: fields.quantity?.toString() || "1",
        colors: splitComma(normalizeField(fields.colors)),
        sizes: splitComma(normalizeField(fields.sizes)),
        condition: fields.condition?.toString(),
        era: fields.era?.toString(),
        categories: (() => {
          try {
            return JSON.parse(fields.categories?.toString() || "[]")
          } catch {
            return []
          }
        })(),
        existingImages: (() => {
          try {
            return JSON.parse(fields.existingImages?.toString() || "[]")
          } catch {
            return []
          }
        })(),
      }

      resolve({ fields: safeFields, files: uploadedFiles })
    })
  })

const uploadFileToCloudinary = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "products" }, (err, result) => {
      if (err) return reject(err)
      resolve(result?.secure_url || "")
    })
    fs.createReadStream(file.filepath).pipe(stream)
  })

const deleteCloudinaryImage = (url: string) => {
  const parts = url.split("/")
  const filename = parts[parts.length - 1]
  const public_id = filename.split(".")[0]
  return cloudinary.uploader.destroy(`products/${public_id}`)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  const productId = req.query.id as string
  if (!productId) return res.status(400).json({ error: "Product ID is required" })

  try {
    const { fields, files } = await parseForm(req)
    const { title, description, price, quantity, colors, sizes, categories, condition, era, existingImages } = fields

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields", debug: fields })
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) return res.status(401).json({ error: "User ID not found in session" })

    // Fetch current product from DB
    const currentProduct = await prisma.product.findUnique({ where: { id: productId } })
    if (!currentProduct) return res.status(404).json({ error: "Product not found" })

    // Safe existing images
    const safeExistingImages = existingImages || []

    // Determine images to delete
    const imagesToDelete = currentProduct.images.filter(img => !safeExistingImages.includes(img))
    await Promise.all(imagesToDelete.map(deleteCloudinaryImage))

    // Upload new images
    const newImageUrls = await Promise.all(files.map(uploadFileToCloudinary))
    const finalImages = [...safeExistingImages, ...newImageUrls]

    // Update product fields
    await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        condition: condition || "",
        era: era || "",
        images: finalImages,
      },
    })

    // Update categories
    await prisma.productCategory.deleteMany({ where: { productId } })
    if (categories && categories.length > 0) {
      const createLinks = categories.map(categoryId => ({
        productId,
        categoryId,
      }))
      await prisma.productCategory.createMany({ data: createLinks })
    }

    res.status(200).json({
      success: true,
      productId,
      debug: { finalImages, deletedImages: imagesToDelete, categories },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    res.status(500).json({ error: "Internal server error", detail: message })
  }
}