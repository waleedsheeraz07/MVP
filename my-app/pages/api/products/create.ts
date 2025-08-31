// src/pages/api/products/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { MongoClient } from "mongodb";
import cloudinary from "../../../lib/cloudinary";
import multer from "multer";

// use multer to parse multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images");

export const config = {
  api: {
    bodyParser: false, // let multer handle it
  },
};

const MONGO_URL = process.env.MONGO_URL!;
const DB_NAME = process.env.MONGO_DB_NAME!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  upload(req as any, res as any, async (err: any) => {
    if (err) return res.status(400).json({ error: "File upload error" });

    try {
      const { title, description, price, quantity } = req.body;
      const colors = req.body["colors[]"] || [];
      const sizes = req.body["sizes[]"] || [];

      if (!title || !price || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1️⃣ Upload all images to Cloudinary
      const files = (req as any).files as Express.Multer.File[];
      const uploadPromises = files.map(file =>
        cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) throw error;
            return result?.secure_url;
          }
        )
      );

      // ⚠️ Need to wrap cloudinary.uploader.upload_stream in a promise
      const uploadImage = (file: Express.Multer.File) => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result?.secure_url || "");
            }
          );
          stream.end(file.buffer);
        });
      };

      const imageUrls = await Promise.all(files.map(uploadImage));

      // 2️⃣ Save product in Mongo
      const client = await MongoClient.connect(MONGO_URL);
      const db = client.db(DB_NAME);

      const product = await db.collection("products").insertOne({
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity),
        colors: Array.isArray(colors) ? colors : [colors],
        sizes: Array.isArray(sizes) ? sizes : [sizes],
        ownerEmail: session.user.email,
        images: imageUrls, // ✅ store Cloudinary URLs
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      client.close();
      res.status(200).json({ success: true, productId: product.insertedId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}