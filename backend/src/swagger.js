const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sales Insight Automator API",
      version: "1.0.0",
      description:
        "Upload CSV/XLSX sales data and receive an AI-generated executive briefing via email. Powered by Groq Llama 3.",
      contact: { name: "Rabbitt AI Engineering" },
    },
    servers: [
      { url: process.env.BACKEND_URL || "http://localhost:4000", description: "Active server" },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Optional API key (required if API_KEY env var is set)",
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/index.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
