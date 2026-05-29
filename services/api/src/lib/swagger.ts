import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mid-Day Meal Monitoring API",
      version: "0.1.0"
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    paths: {
      "/auth/login": {
        post: {
          summary: "Login with email and password",
          tags: ["Authentication"],
          responses: { "200": { description: "JWT token and user profile" } }
        }
      },
      "/meals": {
        get: { summary: "List meals", tags: ["Meals"], security: [{ bearerAuth: [] }], responses: { "200": { description: "Meal list" } } },
        post: { summary: "Create meal entry", tags: ["Meals"], security: [{ bearerAuth: [] }], responses: { "201": { description: "Created meal" } } }
      },
      "/attendance": {
        post: { summary: "Create or update attendance", tags: ["Attendance"], security: [{ bearerAuth: [] }], responses: { "201": { description: "Attendance saved" } } }
      },
      "/ai/generate-weekly-plan": {
        post: { summary: "Generate rule-based weekly meal plan", tags: ["AI"], security: [{ bearerAuth: [] }], responses: { "200": { description: "Generated weekly plan" }, "201": { description: "Generated and saved weekly plan" } } }
      },
      "/analytics/district": {
        get: { summary: "Compare schools in district", tags: ["Analytics"], security: [{ bearerAuth: [] }], responses: { "200": { description: "District analytics" } } }
      }
    }
  },
  apis: ["src/routes/*.ts"]
});
