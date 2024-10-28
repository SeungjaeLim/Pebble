import express from "express";
import { generateDiary, getDiary } from "../controllers/diaryController.js";

const router = express.Router();

/**
 * @swagger
 * /api/diary/generate:
 *   post:
 *     summary: Generate diary entries for a user from Stack Overflow links.
 *     tags: [Diary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userid:
 *                 type: string
 *                 description: ID of the user.
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Date of the Stack Overflow entry.
 *                     url:
 *                       type: string
 *                       description: URL to a Stack Overflow question.
 *     responses:
 *       201:
 *         description: Diary entries generated successfully.
 *       500:
 *         description: Failed to generate diary entries.
 */
router.post("/generate", generateDiary);

/**
 * @swagger
 * /api/diary/get_diary/{userId}:
 *   get:
 *     summary: Retrieve diary entries for a specific user.
 *     tags: [Diary]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: User-specific diary entries grouped by date.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: ID of the user.
 *                 diary:
 *                   type: object
 *                   description: Dictionary where each key is a date with an array of diary entries.
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         diary_id:
 *                           type: integer
 *                           description: Unique identifier for the diary entry.
 *                         date:
 *                           type: string
 *                           format: date
 *                           description: Date of the diary entry.
 *                         img:
 *                           type: string
 *                           format: url
 *                           description: URL of the image generated for the diary entry.
 *                         title:
 *                           type: string
 *                           description: Title of the diary entry.
 *                         content:
 *                           type: string
 *                           description: Summary content of the diary entry.
 *                         study_time:
 *                           type: integer
 *                           description: Randomly generated study time, integer less than 3.
 *       500:
 *         description: Database query error.
 */
router.get("/get_diary/:userId", getDiary);

export default router;
