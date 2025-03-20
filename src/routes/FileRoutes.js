// src/routes/fileRoutes.js
const express = require("express");
const multer = require("multer");
const { uploadFile, getFile, deleteFile } = require("../controllers/FileController");

// Multer setup: store file in memory as a buffer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// POST /v1/file
router.post("/", upload.single("profilePic"), uploadFile);

// GET /v1/file/:id
router.get("/:id", getFile);

// DELETE /v1/file/:id
router.delete("/:id", deleteFile);

// all except post on /v1/file
router.get("/", (req, res) => res.status(400).json({ error: "Bad Request" }));
router.delete("/", (req, res) => res.status(400).json({ error: "Bad Request" }));
router.head("/", (req, res) => res.status(400).json({ error: "Bad Request" }));
router.options("/", (req, res) => res.status(400).json({ error: "Bad Request" }));
router.patch("/", (req, res) => res.status(400).json({ error: "Bad Request" }));
router.put("/", (req, res) => res.status(400).json({ error: "Bad Request" }));

// HEAD, OPTIONS, PATCH, PUT on /v1/file/:id
router.head("/:id", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.options("/:id", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.patch("/:id", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.put("/:id", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));
router.post("/:id", (req, res) => res.status(405).json({ error: "Method Not Allowed" }));

module.exports = router;
