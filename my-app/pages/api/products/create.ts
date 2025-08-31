import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import multer from "multer";

// Set up multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array("images");

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing for multer
  },
};

const MONGO_URL = process.env.MONGO_URL!;
const DB_NAME = process.env.MONGO_DB_NAME!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  upload(req as any, res as any, async (err: any) => {
    if (err) return res.status(400).json({ error: "Error uploading files" });

    const { title, description, price, quantity } = req.body;
    const colors = req.body["colors[]"] || [];
    const sizes = req.body["sizes[]"] || [];

    if (!title || !price || !quantity) return res.status(400).json({ error: "Missing fields" });

    try {
      const client = await MongoClient.connect(MONGO_URL);
      const db = client.db(DB_NAME);

      const bucket = new GridFSBucket(db, { bucketName: "productImages" });

      // Save all uploaded images
      const imageIds: ObjectId[] = [];
      const files = (req as any).files as Express.Multer.File[];

      for (const file of files) {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        imageIds.push(uploadStream.id);
      }

      // Save product document
      const product = await db.collection("products").insertOne({
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity),
        colors: Array.isArray(colors) ? colors : [colors],
        sizes: Array.isArray(sizes) ? sizes : [sizes],
        ownerEmail: session.user.email,
        images: imageIds, // store GridFS IDs
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      client.close();
      res.status(200).json({ success: true, productId: product.insertedId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}