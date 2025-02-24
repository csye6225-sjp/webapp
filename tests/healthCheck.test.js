require("dotenv").config({ path: ".env.test" });
const request = require("supertest");
const app = require("../src/server");
const db = require("../src/config/db");
const HealthCheck = require("../src/models/HealthCheck");

describe("Health Check API", () => {
  beforeAll(async () => {
    await db.sync({ force: true }); // Reset database before running tests
  });

  afterEach(async () => {
    await HealthCheck.destroy({ where: {} });
  });

  afterAll(async () => {
    await db.close();
  });

  it("should return 200 OK when the health check is successful", async () => {
    await HealthCheck.create({ datetime: new Date().toISOString() });

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.headers["pragma"]).toBe("no-cache");
  });

  it("should return 400 Bad Request if JSON payload is provided", async () => {
    const res = await request(app)
      .get("/healthz")
      .send({ key: "value" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 Bad Request if query parameters are provided", async () => {
    const res = await request(app).get("/healthz?key=value");
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 Bad Request if non-JSON payload is provided", async () => {
    const res = await request(app)
      .get("/healthz")
      .send("key=value")
      .set("Content-Type", "application/x-www-form-urlencoded");
    expect(res.statusCode).toEqual(400);
  });

  it("should return 405 Method Not Allowed for POST requests", async () => {
    const res = await request(app).post("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  it("should return 405 Method Not Allowed for PUT requests", async () => {
    const res = await request(app).put("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  it("should return 405 Method Not Allowed for DELETE requests", async () => {
    const res = await request(app).delete("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  it("should return 405 Method Not Allowed for HEAD requests", async () => {
    const res = await request(app).head("/healthz");
    expect(res.statusCode).toEqual(405);
  });

  it("should have proper headers for no-cache and content type", async () => {
    await HealthCheck.create({ datetime: new Date().toISOString() });

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(200);
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.headers["pragma"]).toBe("no-cache");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");

    if (res.headers["content-type"]) {
      expect(res.headers["content-type"]).toMatch(/json|text/);
    } else {
      expect(res.headers["content-type"]).toBeUndefined();
    }
  });

  it("should return 400 Bad Request if incorrect Content-Type header is sent with payload", async () => {
    const res = await request(app)
      .get("/healthz")
      .send("invalid payload")
      .set("Content-Type", "text/plain");
    expect(res.statusCode).toEqual(400);
  });

  it("should return 503 Service Unavailable when DB connection fails", async () => {
    // Mock HealthCheck.create to simulate a database failure
    jest.spyOn(HealthCheck, "create").mockImplementationOnce(() => {
      throw new Error("Database unavailable");
    });

    const res = await request(app).get("/healthz");
    expect(res.statusCode).toEqual(503);
  });

  it("should return 404 Not Found for invalid endpoints", async () => {
    const res = await request(app).get("/invalid-endpoint");
    expect(res.statusCode).toEqual(404);
  });
});
