import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJSDoc from "swagger-jsdoc";

const configDirectory = dirname(fileURLToPath(import.meta.url));
const apiBaseUrl = (
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT || "5000"}`
).replace(/\/+$/, "");
const sourceExtension = import.meta.url.endsWith(".ts") ? "ts" : "js";
const routeDirectory = resolve(configDirectory, "../routes");
const routeFiles = readdirSync(routeDirectory)
  .filter((file) => file.endsWith(`.${sourceExtension}`))
  .map((file) => resolve(routeDirectory, file));

export const openApiSpecification = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "UrbanRent API",
      version: "1.0.0",
      description:
        "HTTP API for UrbanRent property listings, applications, viewing requests, and administration. Every /api endpoint has a shared limit of 300 requests per client per 15 minutes. Register is additionally limited to 20 requests per IP per hour; login to 10 attempts per IP and email per 15 minutes; refresh to 60 per session per 15 minutes (or per IP when no cookie is sent); uploads to 30 per authenticated user per hour. A limit response is HTTP 429 with an ErrorResponse body and RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset headers. /health and the public documentation routes are excluded.",
    },
    servers: [
      {
        url: apiBaseUrl,
        description: process.env.API_BASE_URL
          ? "Configured API base URL"
          : "Local development default; configure API_BASE_URL for deployed environments.",
      },
    ],
    tags: [
      { name: "Health" },
      { name: "Authentication" },
      { name: "Properties" },
      { name: "Amenities" },
      { name: "Images" },
      { name: "Applications" },
      { name: "Viewing requests" },
      { name: "Reports" },
      { name: "Verification" },
      { name: "Admin" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token returned by login or refresh.",
        },
        refreshCookie: {
          type: "apiKey",
          in: "cookie",
          name: "RefreshToken",
          description:
            "Secure, HttpOnly refresh-token cookie set by login, scoped to /api/auth, and configured with COOKIE_SAMESITE (defaults to lax). Browsers send it automatically over HTTPS; refresh and logout do not take it in the JSON body.",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Invalid or missing request data" },
          },
        },
        UserSummary: {
          type: "object",
          required: ["id", "email", "role"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["TENANT", "LANDLORD", "ADMIN"] },
          },
        },
        ContactSummary: {
          type: "object",
          required: ["id", "email"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
          },
        },
        User: {
          allOf: [
            { $ref: "#/components/schemas/UserSummary" },
            {
              type: "object",
              properties: {
                verificationState: { type: "string", enum: ["UNVERIFIED", "VERIFIED"] },
                accountState: { type: "string", enum: ["ACTIVE", "SUSPENDED"] },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        AuthResult: {
          type: "object",
          required: ["message", "user", "accessToken"],
          properties: {
            message: { type: "string" },
            user: { $ref: "#/components/schemas/UserSummary" },
            accessToken: { type: "string", description: "JWT access token." },
          },
        },
        MessageResponse: {
          type: "object",
          required: ["message"],
          properties: { message: { type: "string" } },
        },
        Pagination: {
          type: "object",
          required: ["total", "offset", "limit", "totalPages"],
          properties: {
            total: { type: "integer", minimum: 0 },
            offset: { type: "integer", minimum: 0 },
            limit: { type: "integer", minimum: 1, maximum: 50 },
            totalPages: { type: "integer", minimum: 0 },
          },
        },
        Property: {
          type: "object",
          required: [
            "id",
            "ownerId",
            "title",
            "propertyType",
            "city",
            "monthlyRent",
            "status",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            ownerId: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            propertyType: {
              type: "string",
              enum: ["APARTMENT", "STUDIO", "HOUSE", "VILLA", "COMMERCIAL", "OTHER"],
            },
            bedrooms: { type: "integer", nullable: true },
            bathrooms: { type: "integer", nullable: true },
            sizeSqm: { type: "integer", nullable: true },
            city: { type: "string" },
            neighborhood: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            latitude: { type: "number", format: "double", nullable: true },
            longitude: { type: "number", format: "double", nullable: true },
            monthlyRent: { type: "integer" },
            cautionFee: { type: "integer", nullable: true },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            owner: {
              type: "object",
              description: "Included on selected reads; its fields depend on the endpoint.",
              properties: {
                id: { type: "string", format: "uuid" },
                email: { type: "string", format: "email" },
                verificationState: { type: "string", enum: ["UNVERIFIED", "VERIFIED"] },
              },
            },
          },
        },
        PropertyInput: {
          type: "object",
          required: ["title", "propertyType", "city", "monthlyRent"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            propertyType: {
              type: "string",
              enum: ["APARTMENT", "STUDIO", "HOUSE", "VILLA", "COMMERCIAL", "OTHER"],
            },
            bedrooms: { type: "integer" },
            bathrooms: { type: "integer" },
            sizeSqm: { type: "integer" },
            city: { type: "string" },
            neighborhood: { type: "string" },
            address: { type: "string" },
            latitude: { type: "number", format: "double" },
            longitude: { type: "number", format: "double" },
            monthlyRent: { type: "integer" },
            cautionFee: { type: "integer" },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
              default: "DRAFT",
            },
          },
        },
        PropertyUpdateInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            propertyType: {
              type: "string",
              enum: ["APARTMENT", "STUDIO", "HOUSE", "VILLA", "COMMERCIAL", "OTHER"],
            },
            bedrooms: { type: "integer", nullable: true },
            bathrooms: { type: "integer", nullable: true },
            sizeSqm: { type: "integer", nullable: true },
            city: { type: "string" },
            neighborhood: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            latitude: { type: "number", format: "double", nullable: true },
            longitude: { type: "number", format: "double", nullable: true },
            monthlyRent: { type: "integer" },
            cautionFee: { type: "integer", nullable: true },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
            },
          },
        },
        PropertyPage: {
          allOf: [
            { $ref: "#/components/schemas/Pagination" },
            {
              type: "object",
              required: ["properties"],
              properties: {
                properties: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Property" },
                },
              },
            },
          ],
        },
        UserPage: {
          allOf: [
            { $ref: "#/components/schemas/Pagination" },
            {
              type: "object",
              required: ["users"],
              properties: {
                users: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          ],
        },
        PropertyImage: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            propertyId: { type: "string", format: "uuid" },
            url: { type: "string", format: "uri" },
            publicId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Amenity: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            picture: { type: "string", nullable: true },
          },
        },
        PropertyAmenity: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            propertyId: { type: "string", format: "uuid" },
            amenityId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            amenity: { $ref: "#/components/schemas/Amenity" },
          },
        },
        Application: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            tenantId: { type: "string", format: "uuid" },
            propertyId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"],
            },
            note: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            property: { $ref: "#/components/schemas/Property" },
            tenant: { $ref: "#/components/schemas/ContactSummary" },
          },
        },
        ViewingRequest: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            propertyId: { type: "string", format: "uuid" },
            tenantId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["REQUESTED", "CONFIRMED", "DECLINED", "COMPLETED", "NO_SHOW"],
            },
            proposedTimes: {
              type: "array",
              items: { type: "string", format: "date-time" },
              nullable: true,
            },
            confirmedTime: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            property: { $ref: "#/components/schemas/Property" },
            tenant: { $ref: "#/components/schemas/ContactSummary" },
          },
        },
        PropertyReport: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            reporterId: { type: "string", format: "uuid" },
            propertyId: { type: "string", format: "uuid" },
            reason: {
              type: "string",
              enum: ["SCAM_OR_FRAUD", "MISLEADING_INFORMATION", "ALREADY_RENTED", "OTHER"],
            },
            status: { type: "string", enum: ["OPEN", "REVIEWED", "DISMISSED"] },
            createdAt: { type: "string", format: "date-time" },
            property: { $ref: "#/components/schemas/ReportPropertySummary" },
            reporter: { $ref: "#/components/schemas/ContactSummary" },
          },
        },
        ReportPropertySummary: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            city: { type: "string" },
            status: {
              type: "string",
              enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
            },
          },
        },
        PropertyReportPage: {
          allOf: [
            { $ref: "#/components/schemas/Pagination" },
            {
              type: "object",
              required: ["reports"],
              properties: {
                reports: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PropertyReport" },
                },
              },
            },
          ],
        },
        VerificationDocument: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            url: { type: "string", nullable: true },
            documentType: {
              type: "string",
              enum: ["NATIONAL_ID", "PROOF_OF_OWNERSHIP"],
            },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
            reviewNote: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            storagePath: { type: "string" },
            viewUrl: { type: "string", format: "uri" },
            user: { $ref: "#/components/schemas/ContactSummary" },
          },
        },
        VerificationDocumentPage: {
          allOf: [
            { $ref: "#/components/schemas/Pagination" },
            {
              type: "object",
              required: ["documents"],
              properties: {
                documents: {
                  type: "array",
                  items: { $ref: "#/components/schemas/VerificationDocument" },
                },
              },
            },
          ],
        },
      },
    },
  },
  apis: [
    ...routeFiles,
    resolve(configDirectory, `../app.${sourceExtension}`),
  ],
});
