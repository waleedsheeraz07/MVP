import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "../../lib/cloudinary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const fileStr = req.body.data; // base64 image string
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: "products",
    });

    res.status(200).json({ url: uploadResponse.secure_url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
}