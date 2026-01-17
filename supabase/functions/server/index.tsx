import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c912d88d/health", (c) => {
  return c.json({ status: "ok" });
});

// Analyze images with ChatGPT
app.post("/make-server-c912d88d/analyze-images", async (c) => {
  try {
    const { images } = await c.req.json();

    if (!images || images.length === 0) {
      return c.json({ error: "No images provided" }, 400);
    }

    // Compress images if they're too large
    const compressedImages = images.map((img: string) => {
      // If image is larger than 1MB (approximate base64 length), we should ideally compress
      // For now, we'll just use them as-is since browser already handles reasonable sizes
      return img;
    });

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OpenAI API key is missing");
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    // Prepare image content for OpenAI
    const imageContent = compressedImages.map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img,
        detail: "low", // Use "low" detail for faster processing
      },
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using faster mini model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these images and provide structured data for the following fields.

IMPORTANT: Return ONLY a valid JSON object without any markdown formatting, explanations, or additional text.
CRITICAL: All values MUST be in ENGLISH only. Use the exact English values from the lists below.

Choose ONE value from each list below (use exact English spelling):

- purpose: [SNS Post, TikTok Thumbnail / Short Video Use, YouTube Thumbnail, E-commerce Product Image, Ad Banner, Blog / Media Illustration Image, Profile Icon, Presentation Illustration, LINE-style Stamp Image, App Promotional Visual, Event Announcement Visual]
- subject: [Human, Animal, Food, Vehicle, Building, Landscape, Fantasy creature, Character, Robot, Pet, Plant, Furniture, Home Appliance, Gadget, Art / Abstract Object, Clothing, Cosmetics, Accessories, Dish, Drink]
- situation: [Standing, Sitting, Walking, Running, Working, Eating, Speaking, Posing, Using smartphone, Using computer, Reading, Sleeping, Relaxing, Driving, Shopping, Taking a photo, Being photographed, Exercising, Dancing, Studying, Cooking, Cleaning, Playing games, Talking on the phone]
- age_range: [Newborn / 0–1 month, Infant / 1 month–1 year, Toddler / 1–3 years, Preschooler / 3–6 years, Lower elementary / Grades 1–3, Upper elementary / Grades 4–6, Junior high / 12–15 years, High school / 15–18 years, College / 18–22 years, Young adult / 20–29 years, Adult / 30–39 years, Middle-aged / 40–59 years, Senior / 60–74 years, Elderly / 75+ years]
- gender: [Male, Female, Non-binary, Unknown]
- nationality: [Japan, China, Korea, Taiwan, India, USA, Canada, United Kingdom, France, Germany, Italy, Spain, Russia, Brazil, Mexico, Australia, Turkey, Saudi Arabia, United Arab Emirates, Egypt, South Africa]
- style: [Realistic, Hyper-realistic, Photo-realistic, Cinematic, Natural light photo, Portrait photo, Fashion magazine style, Street snap style, Product photo, High-end camera shot, Smartphone selfie style, Smartphone photo style, Anime, Manga, Watercolor, Oil painting, Fantasy, Cyberpunk, 3D render]
- shot_distance: [Extreme close-up, Close-up, Medium close-up, Medium shot, Full shot, Long shot]
- camera_angle: [Eye-level, Low angle, High angle, Top view, Over-the-shoulder]
- lighting_color: [Natural light, Soft light, Hard light / Hard shadows, Dramatic lighting, Backlight, Top light, Spotlight, Neon light, Low light, Dim light, Night lighting, Isolated spotlight, Warm tone, Cool tone]
- background: [Studio, Living room, Bedroom, Kitchen, Office / Study, Cafe, Classroom, Shop interior, Street, Park, Forest, Beach, Mountain, Sunset outdoors, Night city, Futuristic / Sci-fi, Fantasy world, Space, Factory, Ruins, Abstract, Gradient background, White background, Black background]
- city: [Tokyo, Kyoto, Osaka, Sapporo, Fukuoka, New York, Los Angeles, San Francisco, Paris, London, Berlin, Rome, Beijing, Shanghai, Shenzhen, Seoul, Bangkok]
- location_type: [Downtown, Residential area, Business district, Tourist spot, Old town, Shopping street, Park / Plaza, Riverside / Lakeside, Harbor, Beach area, Airport, Station, Bus terminal, Highway / Main road, Alleyway, Market, Stadium area, Campus / School area, Industrial area, Suburb]
- output_format: [PNG, JPG]
- aspect_ratio: [1:1, 3:4, 4:3, 9:16, 16:9, 21:9]

Example response format (MUST USE ENGLISH VALUES):
{"purpose":"SNS Post","subject":"Human","situation":"Standing","age_range":"Young adult / 20–29 years","gender":"Female","nationality":"Japan","style":"Realistic","shot_distance":"Full shot","camera_angle":"Eye-level","lighting_color":"Natural light","background":"Park","city":"Tokyo","location_type":"Park / Plaza","output_format":"PNG","aspect_ratio":"1:1"}`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 500, // Reduced tokens for faster response
        temperature: 0.3, // Lower temperature for more consistent, faster results
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`OpenAI API error while analyzing images: ${errorText}`);
      return c.json({ error: `Failed to analyze images with OpenAI API: ${errorText}` }, 500);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('OpenAI raw response:', content);

    // Parse JSON from response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = content.trim();
      
      // Remove ```json and ``` markers
      cleanedContent = cleanedContent.replace(/```json\s*/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/g, '');
      
      // Extract JSON object (looking for { ... })
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole content
        analysisResult = JSON.parse(cleanedContent);
      }
      
      console.log('Parsed analysis result:', JSON.stringify(analysisResult));
    } catch (e) {
      console.log(`Failed to parse OpenAI response as JSON. Error: ${e.message}`);
      console.log(`Original content: ${content}`);
      return c.json({ 
        error: "Failed to parse AI response. The AI did not return valid JSON.", 
        details: content 
      }, 500);
    }

    // Add additional_words field with empty string (manual field, not analyzed by AI)
    analysisResult.additional_words = "";

    return c.json({ analysis: analysisResult });
  } catch (error) {
    console.log(`Error in analyze-images endpoint: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);