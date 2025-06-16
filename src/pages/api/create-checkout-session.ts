import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        cookie: req.headers.cookie || '',
      },
    });

    const data = await response.json();
    res.status(response.status).json({ session: data });
  } catch (err) {
    console.error('Checkout session error', err);
    res.status(500).json({ message: 'Failed to create session' });
  }
}
