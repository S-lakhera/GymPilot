import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GymPilot API",
      version: "1.0.0",
      description:
        "API documentation for the GymPilot Full-Stack Gym Management Platform.",
      contact: {
        name: "GymPilot Engineering Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: "Current Environment Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter your JWT access token in the format: Bearer <token>",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
