import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute per IP
const MAX_REQUESTS_PER_HOUR = 20; // 20 requests per hour per IP
const MAX_REQUESTS_PER_DAY = 50; // 50 requests per day per IP

// In-memory store for rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const hourlyStore = new Map<string, { count: number; resetTime: number }>();
const dailyStore = new Map<string, { count: number; resetTime: number }>();

// Helper function to get client IP
const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
};

// Rate limiting function
const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  
  for (const [key, value] of hourlyStore.entries()) {
    if (now > value.resetTime) {
      hourlyStore.delete(key);
    }
  }
  
  for (const [key, value] of dailyStore.entries()) {
    if (now > value.resetTime) {
      dailyStore.delete(key);
    }
  }
  
  // Check minute limit
  const minuteData = rateLimitStore.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  if (now > minuteData.resetTime) {
    minuteData.count = 0;
    minuteData.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  // Check hour limit
  const hourData = hourlyStore.get(ip) || { count: 0, resetTime: now + (60 * 60 * 1000) };
  if (now > hourData.resetTime) {
    hourData.count = 0;
    hourData.resetTime = now + (60 * 60 * 1000);
  }
  
  // Check day limit
  const dayData = dailyStore.get(ip) || { count: 0, resetTime: now + (24 * 60 * 60 * 1000) };
  if (now > dayData.resetTime) {
    dayData.count = 0;
    dayData.resetTime = now + (24 * 60 * 60 * 1000);
  }
  
  // Check limits
  if (minuteData.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetTime: minuteData.resetTime };
  }
  
  if (hourData.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0, resetTime: hourData.resetTime };
  }
  
  if (dayData.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0, resetTime: dayData.resetTime };
  }
  
  // Increment counters
  minuteData.count++;
  hourData.count++;
  dayData.count++;
  
  rateLimitStore.set(ip, minuteData);
  hourlyStore.set(ip, hourData);
  dailyStore.set(ip, dayData);
  
  const remaining = Math.min(
    MAX_REQUESTS_PER_WINDOW - minuteData.count,
    MAX_REQUESTS_PER_HOUR - hourData.count,
    MAX_REQUESTS_PER_DAY - dayData.count
  );
  
  return { allowed: true, remaining, resetTime: minuteData.resetTime };
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type definitions for customization options
interface Customizations {
  backgroundType: string;
  backgroundColor: string;
  faceAngle: string;
  clothing: string;
  portraitSize: string;
}

// Type definitions for Gemini API
interface GeminiModel {
  generateContent: (content: (string | { inlineData: { data: string; mimeType: string } })[]) => Promise<{ response: { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> } }>;
}

interface GeminiPart {
  inlineData?: {
    data: string;
    mimeType: string;
  };
  text?: string;
}

interface InlineData {
  data: string;
  mimeType: string;
}

// Helper function to generate dynamic prompt
const generatePrompt = (customizations: Customizations) => {
  // Map background options
  const backgroundMap: { [key: string]: string } = {
    'gradient': `bold ${customizations.backgroundColor} gradient`,
    'park': 'park',
    'urban': 'urban street',
    'beach': 'beach',
    'mountain': 'mountain',
    'forest': 'forest',
    'office': 'office',
    'studio': 'startup studio',
    'corporate': 'financial corporate',
    'home': 'home interior',
    'library': 'library'
  };

  // Map clothing options
  const clothingMap: { [key: string]: string } = {
    'formal': 'Wearing formal attire',
    'smart-casual': 'Wearing smart casual outfit',
    'street-fashion': 'Wearing street fashion outfit',
    'summer-fashion': 'Wearing summer fashion outfit',
    'sports': 'Wearing sports outfit'
  };

  // Map portrait size options
  const portraitSizeMap: { [key: string]: string } = {
    'full-body': 'This is a full-body portrait',
    'half-body': 'This is a half-body portrait',
    'bust': 'This is a bust portrait'
  };

  // Map face angle options
  const faceAngleMap: { [key: string]: string } = {
    'full-face': 'Full-face view',
    'three-quarter': 'Three-quarter view'
  };

  const backgroundOptions = backgroundMap[customizations.backgroundType] || 'bold blue gradient';
  const clothing = clothingMap[customizations.clothing] || 'Wearing formal attire';
  const portraitSize = portraitSizeMap[customizations.portraitSize] || 'This is a bust portrait';
  const faceAngle = faceAngleMap[customizations.faceAngle] || 'Full-face view';

  return `Transform the person in the photo into highly stylized ultra-realistic portrait, with sharp facial features and flawless fair skin, standing confidently against a ${backgroundOptions} background, looking at the camera. ${clothing} ${portraitSize} Make sure the face features looks exactly same as the input image. Dramatic, cinematic lighting highlights his facial structure, evoking the look of a luxury fashion magazine cover. Center the portrait and ensure it's straight. ${faceAngle} There is only the person, no letters are on the photo. Editorial photography style, high-detail, 4K resolution, symmetrical composition, minimalistic background`;
};

// Helper function to attempt Gemini API call with retry logic
const attemptGeminiGeneration = async (model: GeminiModel, prompt: string, base64Data: string, attempt: number = 1): Promise<InlineData> => {
  try {
    console.log(`Attempt ${attempt} - Calling Gemini API...`);
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts) {
      throw new Error('No content parts found in response');
    }

    // Find the image in the response parts
    const imagePart = parts.find((part: GeminiPart) => part.inlineData);
    
    if (!imagePart || !imagePart.inlineData) {
      // Log the actual response for debugging
      console.error('No image data found in response. Response parts:', parts);
      
      // Check if we got text response instead
      const textParts = parts.filter((part: GeminiPart) => part.text);
      if (textParts.length > 0) {
        const textResponse = textParts.map((part: GeminiPart) => part.text).join(' ');
        console.error('Received text response instead of image:', textResponse);
        throw new Error('The AI model returned text instead of an image. This might be due to content policy restrictions or model limitations.');
      }
      
      throw new Error('No image data found in response');
    }

    console.log(`Attempt ${attempt} - Success!`);
    return imagePart.inlineData;

  } catch (error) {
    console.error(`Attempt ${attempt} failed:`, error);
    
    // Check if this is a retryable error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isRetryableError = errorMessage.includes('500') || 
                            errorMessage.includes('Internal Server Error') ||
                            errorMessage.includes('Service Unavailable') ||
                            errorMessage.includes('Too Many Requests') ||
                            errorMessage.includes('rate limit') ||
                            errorMessage.includes('returned text instead of an image') ||
                            errorMessage.includes('No image data found in response');

    if (isRetryableError && attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms... (${attempt}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
      return attemptGeminiGeneration(model, prompt, base64Data, attempt + 1);
    }

    // If not retryable or max retries reached, throw the error
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      const resetTimeSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: resetTimeSeconds,
          limit: 'Too many requests'
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': resetTimeSeconds.toString(),
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { image, customizations } = body;

    // Input validation
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate image format and size
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Check image size (base64 data should be reasonable)
    const base64Data = image.split(',')[1];
    if (!base64Data || base64Data.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'Image too large. Please use images under 10MB.' }, { status: 400 });
    }

    // Validate customizations if provided
    if (customizations) {
      const validKeys = ['backgroundType', 'backgroundColor', 'faceAngle', 'clothing', 'portraitSize'];
      const providedKeys = Object.keys(customizations);
      const invalidKeys = providedKeys.filter(key => !validKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        return NextResponse.json({ error: 'Invalid customization parameters' }, { status: 400 });
      }
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Use Gemini 2.5 Flash Image Preview model for image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    const prompt = generatePrompt(customizations || {});
    console.log('Generated prompt:', prompt);
    console.log(`Request from IP: ${clientIP}, Remaining requests: ${rateLimitResult.remaining}`);

    // Extract base64 data from the image
    const base64ImageData = base64Data;
    
    // Attempt generation with retry logic
    const imageData = await attemptGeminiGeneration(model, prompt, base64ImageData);

    // Return the generated image as base64
    const generatedImageData = `data:${imageData.mimeType};base64,${imageData.data}`;
    
    return NextResponse.json({ 
      image: generatedImageData,
      success: true,
      prompt: prompt,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }
    });

  } catch (error) {
    console.error('Error generating headshot after all retries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check if this was a retry exhaustion
    const isRetryExhausted = errorMessage.includes('500') || 
                            errorMessage.includes('Internal Server Error') ||
                            errorMessage.includes('Service Unavailable') ||
                            errorMessage.includes('Too Many Requests') ||
                            errorMessage.includes('rate limit');

    if (isRetryExhausted) {
      return NextResponse.json(
        { error: 'The AI model is currently busy. Please try again in a few minutes.' }, 
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to generate headshot: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}
