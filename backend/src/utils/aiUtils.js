const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Generate a concise summary of the provided content using Claude API
 * @param content The study guide content to summarize
 * @returns A concise summary of the content
 */
exports.generateSummary = async (content) => {
  try {
    const prompt = `
      Please provide a concise summary of the following study material. 
      Focus on the key concepts, main ideas, and important details.
      Keep the summary clear, informative, and well-structured.
      
      Study Material:
      ${content}
    `;

    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error generating summary with Claude API:', error);
    return '';
  }
};

/**
 * Generate flashcards from the provided content using Claude API
 * @param content The study guide content to generate flashcards from
 * @returns An array of flashcards with questions and answers
 */
exports.generateFlashcards = async (content) => {
  try {
    const prompt = `
      Please create 5-10 flashcards based on the following study material.
      Each flashcard should have a question on one side and the answer on the other.
      Focus on key concepts, definitions, and important facts.
      Format your response as a JSON array of objects with "question" and "answer" fields.
      
      Study Material:
      ${content}
      
      Example format:
      [
        {
          "question": "What is photosynthesis?",
          "answer": "The process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll."
        },
        {
          "question": "Who wrote 'Romeo and Juliet'?",
          "answer": "William Shakespeare"
        }
      ]
    `;

    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const responseText = response.data.content[0].text;
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const flashcardsJson = JSON.parse(jsonMatch[0]);
      return flashcardsJson;
    }
    
    return [];
  } catch (error) {
    console.error('Error generating flashcards with Claude API:', error);
    return [];
  }
};

/**
 * Extract keywords from the provided content using Claude API
 * @param content The study guide content to extract keywords from
 * @returns An array of keywords with importance ratings for word cloud visualization
 */
exports.extractKeywords = async (content) => {
  try {
    const prompt = `
      Please extract 15-25 important keywords or key phrases from the following study material.
      For each keyword, assign an importance score from 1-10 (10 being most important).
      Format your response as a JSON array of objects with "word" and "importance" fields.
      
      Study Material:
      ${content}
      
      Example format:
      [
        {
          "word": "Photosynthesis",
          "importance": 9
        },
        {
          "word": "Cellular respiration",
          "importance": 8
        },
        {
          "word": "Mitochondria",
          "importance": 7
        }
      ]
    `;

    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const responseText = response.data.content[0].text;
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const keywordsJson = JSON.parse(jsonMatch[0]);
      return keywordsJson;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting keywords with Claude API:', error);
    return [];
  }
};
