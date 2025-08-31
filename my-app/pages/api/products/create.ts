import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";
import formidable, { File } from "formidable-serverless";
import fs from "fs";

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormFields {
  title: string;
  description?: string;
  price: string;
  quantity: string;
  colors?: string[];
  sizes?: string[];
}

const parseForm = (req: NextApiRequest): Promise<{ fields: FormFields; files: File[] }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      const uploadedFiles: File[] = [];
      if (files.images) {
        if (Array.isArray(files.images)) uploadedFiles.push(...files.images);
        else uploadedFiles.push(files.images as File);
      }

      resolve({ fields: fields as FormFields, files: uploadedFiles });
    });
  });
};

const uploadFileToCloudinary = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    fs.createReadStream(file.filepath).pipe(stream);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors = [], sizes = [] } = fields;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageUrls = await Promise.all(files.map(uploadFileToCloudinary));

    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity),
        colors,
        sizes,
        ownerId: session.user.id,
        images: imageUrls,
      },
    });

    res.status(201).json({ success: true, productId: product.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}