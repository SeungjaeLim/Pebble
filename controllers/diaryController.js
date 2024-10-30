import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
import connection from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI();

/**
 * Fetch and parse StackOverflow question and answer from a URL.
 */
function fetchQuestionAnswer(url) {
    return axios.get(url)
      .then(response => {
        const $ = cheerio.load(response.data);
        
        const question = $("h1.fs-headline1").text().trim();
        
        const answerElements = $(".js-post-body");
        const fullAnswer = answerElements.map((i, elem) => $(elem).text().trim()).get().join("\n\n");
        
        // Limit answer to 2000 characters if necessary
        const truncatedAnswer = fullAnswer.length > 2000 ? fullAnswer.substring(0, 2000) : fullAnswer;

        return { question, answer: truncatedAnswer, url };
      })
      .catch(error => {
        console.error(`Failed to parse StackOverflow URL: ${url}`, error);
        return { question: "", answer: "", url };
      });
}

/**
 * Generate diary entries based on parsed data from StackOverflow.
 */
function generateDiary(req, res) {
    console.log("API called: generateDiary");
    console.log(req.body);
    const { userid, history } = req.body;
    let parsedPosts = [];
  
    const urls = history.map(entry => entry.url);
    const checkUrlsQuery = `SELECT url FROM diary WHERE user_id = ? AND url IN (?)`;
  
    connection.query(checkUrlsQuery, [userid, urls], (err, results) => {
      if (err) {
        console.error("Error checking existing URLs:", err);
        return res.status(500).json({ error: "Database query error" });
      }
  
      const existingUrls = new Set(results.map(row => row.url));
      const filteredHistory = history.filter(entry => !existingUrls.has(entry.url));
  
      if (filteredHistory.length === 0) {
        console.log("All URLs already generated for this user, nothing to process.");
        return res.status(200).json({ message: "All URLs already generated for this user." });
      }
  
      const fetchPromises = filteredHistory.map(entry => {
        return fetchQuestionAnswer(entry.url).then(({ question, answer }) => {
          parsedPosts.push({ question, answer, date: entry.date, url: entry.url });
        });
      });
  
      Promise.all(fetchPromises)
        .then(() => {
          if (parsedPosts.length === 0) {
            return res.status(400).json({ error: "No valid data parsed from URLs." });
          }
  
          // Separate posts into even and odd indices
          const evenPosts = parsedPosts.filter((_, index) => index % 2 === 0);
          const oddPosts = parsedPosts.filter((_, index) => index % 2 !== 0);
  
          const groupPosts = (posts) => {
            const grouped = [];
            for (let i = 0; i < posts.length; i += 3) {
              const group = posts.slice(i, i + 3);
              const concatenatedQuestion = group.map(post => post.question).join("\n\n");
              const concatenatedAnswer = group.map(post => post.answer).join("\n\n");
              const firstUrl = group[0].url;
              grouped.push({
                date: group[0].date,
                question: concatenatedQuestion,
                answer: concatenatedAnswer,
                url: firstUrl,
              });
            }
            return grouped;
          };
  
          // Concatenate entries for even and odd grouped posts
          const groupedPosts = [...groupPosts(evenPosts), ...groupPosts(oddPosts)];
  
          const processPostPromises = groupedPosts.map((post, i) => {
            const { question, answer, date, url } = post;
            return openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { 
                  role: "system", 
                  content: "You are a college student keeping a daily learning journal. Based on the examples, generate a short, keyword-based title for the provided input. Keep it concise and insightful, similar to a diary entry title." 
                },
                { role: "assistant", content: "Example: \nInput: 'Learned about neural networks and backpropagation in class today. Focused on understanding gradients and the importance of weight updates.' \nTitle: 'Neural Networks & Backpropagation'" },
                { role: "assistant", content: "Example: \nInput: 'Read an article on sustainable energy solutions and the impact of solar technology on reducing emissions. Fascinating insights into renewable energy advancements.' \nTitle: 'Sustainable Energy & Solar Technology'" },
                { role: "user", content: `${question}\n${answer}` },
              ],
            })
              .then(titleCompletion => {
                const title = titleCompletion.choices[0]?.message?.content;
                if (!title) return Promise.resolve();
  
                return openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    { 
                      role: "system", 
                      content: "You're a college student keeping a learning journal. Summarize the input in 2-3 sentences to capture what you learned, the key takeaways, and any personal insights, as shown in the examples. Use a light, reflective tone." 
                    },
                    { role: "assistant", content: "Example: \nInput: 'Learned about neural networks and backpropagation in class today. Focused on understanding gradients and the importance of weight updates.' \nSummary: 'Today, I explored how neural networks use backpropagation to adjust weights, driven by gradient calculations. It was helpful to understand how each update moves the network closer to minimizing errors, making predictions more accurate.'" },
                    { role: "assistant", content: "Example: \nInput: 'Read an article on sustainable energy solutions and the impact of solar technology on reducing emissions. Fascinating insights into renewable energy advancements.' \nSummary: 'I dived into renewable energy today, especially the role of solar tech in reducing emissions. It’s inspiring to see how advancements in solar power could help create a sustainable future.'" },
                    { role: "user", content: `${question}\n${answer}` },
                  ],
                })
                  .then(summaryCompletion => {
                    const summary = summaryCompletion.choices[0]?.message?.content;
                    if (!summary) return Promise.resolve();
  
                    return openai.images.generate({
                      model: "dall-e-3",
                      prompt: `A crayon drawing by an elementary school student showing "${question}". The drawing uses thick, colorful crayon strokes and playful lines typical of a child’s artwork. The scene is simple and imaginative, with uneven, bold lines and vibrant colors. The background includes "${answer}". The drawing has a childlike quality, with bright, expressive colors and a fun, creative layout.`,
                      n: 1,
                      size: "1792x1024",
                    })
                      .then(imageResponse => {
                        const imageUrl = imageResponse.data[0]?.url;
                        if (!imageUrl) return Promise.resolve();
  
                        const query = `INSERT INTO diary (user_id, date, picture, title, post, parsed_post, url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                        const parsedContent = `${question}\n${answer}`;
  
                        return new Promise((resolve, reject) => {
                          connection.query(query, [userid, date, imageUrl, title, summary, parsedContent, url], err => {
                            if (err) {
                              console.error("Database insert error:", err);
                              reject(err);
                            } else {
                              console.log(`Diary entry for entry ${i + 1} inserted successfully.`);
                              resolve();
                            }
                          });
                        });
                      });
                  });
              })
              .catch(err => console.error(`Error generating title, summary, or image for entry ${i + 1}:`, err));
          });
  
          return Promise.all(processPostPromises);
        })
        .then(() => {
          res.status(201).json({ message: "Diary entries generated successfully." });
        })
        .catch(error => {
          console.error("Error generating diary:", error);
          res.status(500).json({ error: "Failed to generate diary entries." });
        });
    });
  }

function getDiary(req, res) {
    console.log("API called: getDiary");
    console.log(req.params);
    const userId = req.params.userId;
    const query = `SELECT * FROM diary WHERE user_id = ?`;

    connection.query(query, [userId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: "Database query error" });
      }

      // Organize diary entries by date as an object with date keys
      const diaryEntries = results.reduce((acc, entry) => {
        const dateKey = entry.date.toISOString().split('T')[0];

        const formattedEntry = {
          diary_id: entry.id,
          date: dateKey,
          img: entry.picture,
          title: entry.title,
          content: entry.post,
          study_time: Math.floor(Math.random() * 3), // Random study time less than 3
        };

        // Initialize an array for each date key if it doesn't exist, then push the entry
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(formattedEntry);

        return acc;
      }, {});

      // Structure the final response
      const response = {
        user_id: userId,
        diary: diaryEntries, // Now diary is an object with date keys
      };

      res.status(200).json(response);
    });
}

export { generateDiary, getDiary };
