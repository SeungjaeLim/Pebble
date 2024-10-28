import express from "express";
import cors from "cors"; 
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import diaryRoutes from "./routes/diaryRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins, or specify your frontend origin
  }));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pebble Diary API",
      version: "1.0.0",
      description: "API for generating and retrieving user diaries from Stack Overflow questions.",
    },
    servers: [
      {
        url: `http://${process.env.PUBLIC_IP || "localhost"}:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/diary", diaryRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://${process.env.PUBLIC_IP || "localhost"}:${PORT}`);
  console.log(`Swagger docs available at http://${process.env.PUBLIC_IP || "localhost"}:${PORT}/api-docs`);
});
