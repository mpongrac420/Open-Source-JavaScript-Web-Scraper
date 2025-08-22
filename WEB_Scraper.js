require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const GroqClient = require('../utils/groq');
// get urls
const { createClient } = require('@supabase/supabase-js');

// Configure Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' }
  }
);
// Initialize Groq client
const groq = new GroqClient(process.env.GROQ_API_KEY, {
  defaultModel: 'llama3-70b-8192' // this is the specified model we are using you can change between many other models
});

// Modified to accept extractedContent as parameter
async function analyzeContentWithLLM(extractedContent) {
  try {
    const messages = [
    { 
      role: 'system', 
      content: `ROLE: [SPECIFY THE ROLE e.g. Analyst]
      EXPECTED OUTPUT: [specify what you want extracted, what type of data (summary, date, or more specific data like price of item, time of delivery or all together. Separate with a '-' in new line)]
      
      Strict Rules:
      [SPECIFY STRICT RULES (NUMBERED). For instance, if you want it to return JSON the rule is: 1. Return a VALID JSON object.]`

    },
    {
      // client side
      role: 'user',
      content: `[SPECIFY WHAT HE IS ANALYZING IN SHORT (ANALYZE THE BELOW DOCUMENT)]:
      ${extractedContent.substring(0, 15000)}` // extracted text from the website
    }
  ];

    const response = await groq.createChatCompletion(messages, {
      temperature: 0.3,  // Lower temperature for more consistent JSON
      max_tokens: 1024, // maximum tokens the LLM is allowed to use on your response
      stream: false,
      response_format: { type: "json_object" }  // Explicit JSON mode
    });

    // Extract JSON from response (handling both raw JSON and wrapped responses)
    let jsonString = response.content;
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0];
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0];
    } // there are cases where the LLM gets confused and outputs something like this: ```json {"data":"", "scraped_at":""}``` which is not parsable valid JSON so we correct it with this function

    const results = JSON.parse(jsonString.trim());
    return results;

  } catch (error) {
    console.error('LLM Analysis Failed:', {
      error: error.message,
      responseContent: error.response?.content
    });
    throw new Error('Failed to parse LLM response');
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // if false, it will open a physical instance, so a new browser on your front window. If true it will run in the background so you wont see the process.
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // open browser
    args: ['--start-fullscreen', '--profile-directory=Profile 1'], // fullscreen mode
  });

  const page = await browser.newPage(); // wait for page load

  const urls = (await fs.readFile(path.join(__dirname, 'urls.txt'), 'utf-8')) // get the url(s)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean); // filters out empty lines


      console.log(`🌐 Processing URL: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 37000));

      // Handle cookies - accepts automatically
      try {
        await page.waitForSelector('a.wt-ecl-button[href="#refuse"]', { timeout: 1500 });
        await page.click('a.wt-ecl-button[href="#refuse"]');
        console.log('✅ Cookie consent accepted');
      } catch (err) {
        console.log('⚠️ No cookie popup found');
      }

      // Extract content
      const extractedContent = await page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.body);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand('copy');
          const fullText = selection.toString();
          const shareIndex = fullText.indexOf('Share this page');
          return shareIndex !== -1 ? fullText.substring(0, shareIndex) : fullText;
        } finally {
          selection.removeAllRanges();
        }
      });

      // Analyze content
      const analysisResults = await analyzeContentWithLLM(extractedContent);
      console.log(analysisResults);

      // Save to Supabase
      console.log('🔄 Upserting data to Supabase...');
      const { error } = await supabase
        .from('[table_name]')
        .upsert({ // if the record already exists it overwrites it
          [column_name1]: targetUrl,
          [column_name2]: [response]
        }, {
          onConflict: '[column_name1]',
          returning: 'minimal'
        });

      if (error) {
        console.error('❌ Supabase upsert error:', JSON.stringify(error, null, 2));
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }

      console.log('✅ Data successfully upserted to Supabase');
    } catch (error) {
      console.error(`❌ Error processing ${targetUrl}:`, error);
    }
  }

  await browser.close();
})();
