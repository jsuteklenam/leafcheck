// api/diagnose.js
//
// This runs on Vercel's servers, not in the browser — so the crop.health
// API key stays private here and is never sent to, or visible from, the
// user's device. The frontend calls THIS endpoint (/api/diagnose) instead
// of calling crop.kindwise.com directly.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { imageBase64 } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing "imageBase64" in request body.' });
  }

  const apiKey = process.env.KINDWISE_API_KEY;
  if (!apiKey) {
    // This means the environment variable hasn't been set in Vercel yet.
    return res.status(500).json({
      error: 'Server is not configured with a KINDWISE_API_KEY environment variable.'
    });
  }

  try {
    const kindwiseResponse = await fetch(
      'https://crop.kindwise.com/api/v1/identification?details=common_names,description,treatment,classification,cause',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey
        },
        body: JSON.stringify({
          images: [imageBase64],
          similar_images: false
        })
      }
    );

    const data = await kindwiseResponse.json();

    if (!kindwiseResponse.ok) {
      return res.status(kindwiseResponse.status).json({
        error: 'crop.health API returned an error.',
        detail: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error calling crop.health:', err);
    return res.status(500).json({ error: 'Internal server error while contacting crop.health.' });
  }
}
