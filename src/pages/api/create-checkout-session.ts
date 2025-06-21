import type { NextApiRequest, NextApiResponse } from 'next';

const PLAN_TO_PRICE_ID = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
  annual: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Incoming method:', req.method);
  console.log('Incoming body:', req.body);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  console.log('BODY RECEIVED:', req.body);

  const { userId, plan } = req.body;

  const priceId = PLAN_TO_PRICE_ID[plan as keyof typeof PLAN_TO_PRICE_ID];

  if (!userId || !priceId) {
    return res.status(400).json({ message: 'Missing required data: userId or priceId' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.cookie || '',
      },
      body: JSON.stringify({ userId, priceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ message: 'Failed to create session' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};