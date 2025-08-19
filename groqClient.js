// utils/groq.js
const axios = require('axios');

class GroqClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Groq API key is required');
    }
    this.apiKey = apiKey;
    this.baseURL = 'https://api.groq.com/openai/v1';
    this.defaultModel = options.defaultModel || 'llama3-70b-8192'; // Updated default model
  }

  async createChatCompletion(messages, options = {}) {
    try {
      // Validate messages
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages array must contain at least one message');
      }

      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/chat/completions`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          model: options.model || this.defaultModel,
          messages: this.validateMessages(messages),
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1024,
          top_p: options.top_p || 1,
          stream: options.stream || false,
        },
        timeout: options.timeout || 30000,
      });

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new Error(this.parseError(error));
    }
  }

  validateMessages(messages) {
    return messages.map(msg => {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have "role" and "content" properties');
      }
      return {
        role: msg.role, // 'system', 'user', or 'assistant'
        content: String(msg.content)
      };
    });
  }

  parseError(error) {
    if (error.response) {
      if (error.response.status === 400) {
        return `Invalid request: ${error.response.data.error?.message || 'Check your request format'}`;
      }
      return `API Error [${error.response.status}]: ${error.response.data.error?.message || error.response.statusText}`;
    }
    return error.message;
  }
}

module.exports = GroqClient;
