const request = require("supertest");
const express = require("express");
const healthCheckRoutes = require("../routes/HealthCheckRoutes");

// Mock the HealthCheck model
jest.mock("../models/HealthCheck", () => ({
  create: jest.fn(), // Mock the create function
}));

const HealthCheck = require("../models/HealthCheck"); // Import mocked model

// Create an instance of the app for testing
const app = express();
app.use(express.json());
app.use("/healthz", healthCheckRoutes);

describe("Health Check API", () => {

  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks between tests
  });

  // Test success scenario (200 OK)
  it("should return 200 OK when the health check is successful", async () => {
    HealthCheck.create.mockResolvedValueOnce({ datetime: new Date().toISOString() }); // Mock success response

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({});
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.headers["pragma"]).toBe("no-cache");
  });

  // Test failure scenario (400 Bad Request for JSON payload)
  it("should return 400 Bad Request if JSON payload is provided", async () => {
    const res = await request(app)
      .get("/healthz")
      .send({ key: "value" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toEqual(400);
  });

  // Test failure scenario (400 Bad Request for query parameters)
  it("should return 400 Bad Request if query parameters are provided", async () => {
    const res = await request(app).get("/healthz?key=value");
    expect(res.statusCode).toEqual(400);
  });

  // Test failure scenario (400 Bad Request for non-JSON payload)
  it("should return 400 Bad Request if non-JSON payload is provided", async () => {
    const res = await request(app)
      .get("/healthz")
      .send("key=value")
      .set("Content-Type", "application/x-www-form-urlencoded");
    expect(res.statusCode).toEqual(400);
  });

  // Test unsupported method (405 Method Not Allowed for POST)
  it("should return 405 Method Not Allowed for POST requests", async () => {
    const res = await request(app).post("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  // Test unsupported method (405 Method Not Allowed for PUT)
  it("should return 405 Method Not Allowed for PUT requests", async () => {
    const res = await request(app).put("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  // Test unsupported method (405 Method Not Allowed for DELETE)
  it("should return 405 Method Not Allowed for DELETE requests", async () => {
    const res = await request(app).delete("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  // Test unsupported method (405 Method Not Allowed for HEAD)
  it("should return 405 Method Not Allowed for HEAD requests", async () => {
    const res = await request(app).head("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  // Test content-type headers for success
  it("should have proper headers for no-cache and content type", async () => {
    HealthCheck.create.mockResolvedValueOnce({ datetime: new Date().toISOString() }); // Mock success response

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.headers["pragma"]).toBe("no-cache");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");

    // Check if content-type is set, then match
    if (res.headers["content-type"]) {
      expect(res.headers["content-type"]).toMatch(/json|text/);
    } else {
      expect(res.headers["content-type"]).toBeUndefined(); // Allow undefined if no payload
    }
  });

  // Test incorrect content-type header
  it("should return 400 Bad Request if incorrect Content-Type header is sent with payload", async () => {
    const res = await request(app)
      .get("/healthz")
      .send("invalid payload")
      .set("Content-Type", "text/plain");
    expect(res.statusCode).toEqual(400);
  });

  // Simulate database failure (503 Service Unavailable)
  it("should return 503 Service Unavailable when DB connection fails", async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs
    HealthCheck.create.mockRejectedValueOnce(new Error("DB connection failed")); // Mock DB failure

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(503);
  });

  // Test invalid endpoint
  it("should return 404 Not Found for invalid endpoints", async () => {
    const res = await request(app).get("/invalid-endpoint");
    expect(res.statusCode).toEqual(404);
  });

});
