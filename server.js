require('dotenv').config();
const express = require('express'); // <-- Must appear only once!
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

// ... rest of the code ...
// Middleware
app.use(cors()); // Allows your website to talk to this server
app.use(express.json()); // Lets the server read JSON data

// AI Suggestion Endpoint
app.post('/api/suggestions', async (req, res) => {
  const { goal } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!goal) return res.status(400).json({ error: 'Goal is required' });

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "You are a habit coach. Return exactly 5 simple, daily, measurable habits separated by newlines. No numbers, no intro." },
        { role: "user", content: `Suggest habits for the goal: ${goal}` }
      ],
      max_tokens: 150
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      }
    });

    const habits = response.data.choices[0].message.content
      .split('\n')
      .map(h => h.trim())
      .filter(h => h !== "");

    res.json({ habits });

 } catch (error) {
    // Add this line to see the HTTP error code!
    const statusCode = error.response ? error.response.status : 'N/A';
    console.error("AI Error Status Code:", statusCode); // <--- ADD THIS LINE
    console.error("AI Error:", error.response ? error.response.data : error.message);
  res.status(500).json({ error: 'AI Suggestion failed' });
 }
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
async function getAISuggestions(goal) {
  // 🛑 FIX: Call your local Node.js server, not the external OpenAI API
  const response = await fetch("http://localhost:3000/api/suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Send the user's goal to the backend server
    body: JSON.stringify({ goal: goal })
  });
  
  // Check for errors from the local server
  if (!response.ok) {
    const error = await response.json();
    alert(`Server Error: ${error.error}`);
    return [];
  }

  // The server returns a JSON object with a 'habits' array
  const data = await response.json();
  
  // The backend already processed the text, so just return the array
  return data.habits; 
}