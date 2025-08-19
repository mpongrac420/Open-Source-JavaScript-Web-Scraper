# Open-Source-JavaScript-Web-Scraper
This is an open-sourced JavaScript scraper, capable of crawling any webpage link and extracting all data visible. Due to the robust design it does not break when encountering dynamic or static websites. The model also has an LLM API integration.

# How to Use

* First make sure you have node.js installed.

* Add in the url paths to the webpages you wish to scrape. (There is no top limit for the MAX amount of links but be aware the *FREE* LLMs we are using are only capable of processing ≈ 125 scrapes per day. It is recommended to set-up 2 different groq.ai developer accounts and gain access to 2+ API keys to increase productivity. Switching between LLMs is also highly recommended as the daily limits do *NOT* stack and are separate for each LLM)

# How the scrape works
  * The model is designed to "crawl" the webpage. It can either perform in attended or unattended mode. If you wish to use attended, every webpage, the model crawls will be shortly (1s - 2s) visible on your screen before it's closed.
  * The model is capable of recognizing all visible text on the webpage even if it is dynamically loaded.
  * BONUS: 99% of webpages, upon entering them, prompt you with a "Agree to use Cookies". The model is robust enough to handle that roadblock (#Note - There is a slight possibility, different *NATURAL* languages might make it hallucinate ... in the actual scraper.js file, there will be a brief description of how to fix such issues.)

  * An integrated LLM processing system is also implemented into the scraper. At the bottom of this file, there's 5+ different *FREE* LLMs, you can use to process your data. #Note - These LLMs are part of Groq.ai, and won't work if you're using openai API endpoint
  * In the scraper.js file, the part where the groq (openai) API is prompted. You are free to adjust the prompt to your preferences. (Using the LLM through an API is the same as typing up Chatgpt.com and using it there)
  * After we *FETCH* the response from the LLM, the next step is storing it. My choice for this open-sourced project is Supabase - PostgreSQL (this open-sourced scraper was used for a large-scale startup with production code so that's why we're using Supabase and not a NoSQL DB) ... if you are working on a learning project, for fun I'd recommend a NoSQL Database like MongoDB
