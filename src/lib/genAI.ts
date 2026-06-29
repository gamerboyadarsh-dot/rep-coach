import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

/**
 * Sends a base64 image frame to Gemini 1.5 Flash to get actionable form advice.
 * We use 1.5 Flash because it's super fast, which is critical for real-time coaching.
 */
export async function getVisionCoachingAdvice(base64Image: string, exerciseName: string): Promise<string | null> {
  if (!apiKey) {
    console.warn('Gemini API key is missing. Skipping vision coaching.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Strip the data URL prefix to get the raw base64 string
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) return null;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ];

    const prompt = `You are an elite, expert personal trainer. 
The user is attempting to perform a ${exerciseName}, but they are failing the rep due to bad form.
Analyze this single frame (taken at the moment of their failure or lowest point).
Provide EXACTLY ONE short, punchy sentence of actionable coaching advice.
Example: "Your knees are caving in, push them outwards!"
Example: "You aren't going low enough, drop your hips further!"
Do not include any pleasantries or conversational text. Just the single sentence of advice.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error fetching vision coaching from Gemini:', error);
    return null;
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachment?: {
    data: string; // base64 without prefix
    mimeType: string;
    fileName?: string;
  };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function sendChatMessageToCoach(
  history: ChatMessage[],
  newText: string,
  attachment?: { data: string; mimeType: string }
): Promise<string> {
  if (!apiKey) return "API key is missing! Please configure it in .env.";
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: "You are RepCoach AI, an elite fitness personal trainer chatbot. Answer fitness questions, guide the user, analyze their form from uploaded images, or review their workout plans from uploaded PDFs. Keep your responses motivating, concise, and helpful."
  });
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.attachment) {
      parts.push({
        inlineData: { data: msg.attachment.data, mimeType: msg.attachment.mimeType }
      });
    }
    return { role: msg.role, parts };
  });

  const newParts: any[] = [{ text: newText }];
  if (attachment) {
    newParts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
  }
  contents.push({ role: 'user', parts: newParts });

  try {
    const result = await model.generateContent({ contents });
    return result.response.text();
  } catch (err) {
    console.error('Chat error:', err);
    return "Sorry, I had trouble processing that request.";
  }
}
