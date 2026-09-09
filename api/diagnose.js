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
      'https://crop.kindwise.com/api/v1/identification?details=common_names,description,treatment,taxonomy,wiki_url',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey
        },
        body: JSON.stringify({
          images: [imageBase64]
        })
      }
    );

    const rawText = await kindwiseResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // crop.health sent back something that isn't JSON (an error page,
      // a plain-text message, etc.) — surface it as-is so we can see
      // exactly what went wrong instead of crashing.
      return res.status(kindwiseResponse.status || 500).json({
        error: 'crop.health returned a non-JSON response.',
        status: kindwiseResponse.status,
        rawBody: rawText.slice(0, 500)
      });
    }

    if (!kindwiseResponse.ok) {
      return res.status(kindwiseResponse.status).json({
        error: 'crop.health API returned an error.',
        detail: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error calling crop.health:', err);
    return res.status(500).json({
      error: 'Internal server error while contacting crop.health.',
      detail: err.message
    });
  }
}
