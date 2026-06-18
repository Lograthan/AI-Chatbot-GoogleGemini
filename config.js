/**
 * Configuration Settings for Google Gemini 2.5 Flash Chatbot
 * 
 * To run the app, paste your Gemini API Key in the `GEMINI_API_KEY` field below,
 * or use the settings panel inside the chatbot UI.
 */
export const CONFIG = {
  // Google Gemini API Configuration
  // Get an API key from Google AI Studio: https://aistudio.google.com/
  GEMINI_API_KEY: '', 

  // Endpoint for Gemini 2.5 Flash
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',

  // Chat Model Parameters
  GENERATION_CONFIG: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  },

  // Default system instructions to define chatbot's persona
  SYSTEM_INSTRUCTION: {
    parts: [
      {
        text: "You are a helpful, professional, and friendly AI chatbot integrated with Google Gemini 2.5 Flash. Respond clearly, keep your responses concise and well-structured, and use markdown formatting where appropriate. Provide code blocks with correct language tags if asked for code."
      }
    ]
  },

  // Safety settings to ensure responsible AI behaviors
  SAFETY_SETTINGS: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ],

  // API Request Retry Configuration for robustness against rate-limits (429) or temporary outages
  RETRY_CONFIG: {
    maxRetries: 3,          // Maximum number of attempts
    initialDelayMs: 1000,    // Starting delay for exponential backoff
    backoffFactor: 2,       // Multiplier for each subsequent retry delay
  }
};
