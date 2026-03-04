/**
 * Claude AI integration for receipt image parsing.
 * Uses Anthropic Messages API (claude-haiku-4-5 for cost-efficient vision tasks).
 * Requires VITE_ANTHROPIC_API_KEY in .env.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const RECEIPT_PROMPT = `Analyze this receipt image and extract the following information in JSON format:
- store_name: The name of the store.
- buy_date: The date of purchase in YYYY-MM-DD format.
- items: An array of items purchased, each with:
  - name: The name of the item.
  - quantity: The quantity purchased (default to 1 if not specified).
  - price: The price per unit (or total price if unit price is missing).

Return ONLY the JSON object, no markdown formatting.
If the date is missing, use today's date.
If the store name is missing, use "Unknown Store".`

export async function parseReceiptImage(base64Image: string) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key is missing. Please set VITE_ANTHROPIC_API_KEY in your .env file.')
  }

  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-request-allow-origins': window.location.origin,
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: RECEIPT_PROMPT,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Claude API error (${response.status}): ${detail}`)
  }

  const data = await response.json()
  const text: string = data.content?.[0]?.text ?? ''

  // Strip markdown code fences if the model wraps the JSON
  const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()

  try {
    return JSON.parse(jsonString)
  } catch {
    throw new Error('Failed to parse Claude response as JSON. Raw response: ' + text)
  }
}
