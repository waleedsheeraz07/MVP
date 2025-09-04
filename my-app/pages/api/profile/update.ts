// pages/api/profile/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;
    const {
      firstName,
      lastName,
      dob,
      gender,
      phoneNumber,
      address1,
      address2,
      state,
      country,
      postalCode,
      email,
    } = req.body;

    // Optional: You can validate email format here if needed

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        dob: dob ? new Date(dob) : null,
        gender,
        phoneNumber,
        address1,
        address2,
        state,
        country,
        postalCode,
        email,
      },
    });

    return res.status(200).json({ user: updatedUser });
  } catch (err: unknown) {
    console.error(err);
    let message = "An unexpected error occurred";
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: message });
  }
}