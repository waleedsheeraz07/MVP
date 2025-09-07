import type { NextApiRequest, NextApiResponse } from "next";
import { resend } from "../../lib/resend";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await resend.emails.send({
      from: "no-reply@vintageitems.work.gd", // use your verified domain
      to: "waleedsheeraz06@gmail.com", // send to your own email for testing
      subject: "Test Email",
      html: "<p>Hello Captain, this is your first automated email 🚀</p>",
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
}