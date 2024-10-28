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
                { role: "system", content: "You are a college student keeping an art journal. You are going to give your journal a title. Please give it a short, simple title for any of the following. Be brief and contain only keywords." },
                { role: "user", content: `${question}\n${answer}` },
              ],
            })
              .then(titleCompletion => {
                const title = titleCompletion.choices[0]?.message?.content;
                if (!title) return Promise.resolve();
  
                return openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    { role: "system", content: "You're a college student keeping a journal, and you want to summarize the article below in 3 sentences or so, like Today I learned. In the same tone as if you were journaling about what you learned and what the concept was." },
                    { role: "user", content: `${question}\n${answer}` },
                  ],
                })
                  .then(summaryCompletion => {
                    const summary = summaryCompletion.choices[0]?.message?.content;
                    if (!summary) return Promise.resolve();
  
                    return openai.images.generate({
                      model: "dall-e-3",
                      prompt: `Create a crayon drawing of the sentence in "${question}" that looks like something an elementary school student would put in a picture journal.`,
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
