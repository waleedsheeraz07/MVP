import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { title, parent } = req.body;

    const maxOrder = await prisma.category.aggregate({
      _max: { order: true },
    });

    const newCategory = await prisma.category.create({
      data: {
        title,
        parentId: parent || null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    res.json(newCategory);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}