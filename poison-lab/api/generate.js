export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  const systemPrompt = `You are The Poison Lab — an elite, poetic cocktail alchemist. 
Your task: receive a list of ingredients and create ONE exceptional cocktail recipe.

ALWAYS respond with ONLY a valid JSON object, no markdown, no extra text.

JSON structure:
{
  "name": "Creative, dramatic cocktail name (2-4 words)",
  "description": "A 2-sentence poetic, evocative description of the drink's soul and taste.",
  "prepTime": "X min",
  "difficulty": "Easy" | "Medium" | "Hard",
  "serves": "1" | "2",
  "ingredients": [
    { "name": "Ingredient name", "amount": "XXml" or "X units" or "to taste" }
  ],
  "steps": [
    "Step instruction 1.",
    "Step instruction 2.",
    "Step instruction 3."
  ]
}

Rules:
- Use ONLY ingredients the user mentions (you may add water, ice if not mentioned)
- Give exact ml measurements for liquids
- Name must be creative, dramatic, unexpected
- Description must be poetic and sensory
- Steps: 3 to 6 clear instructions
- Difficulty based on technique required`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `My ingredients: ${ingredients}` }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const rawText = data.content.map(b => b.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(clean);

    return res.status(200).json(recipe);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
