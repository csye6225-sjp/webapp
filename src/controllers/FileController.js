// src/controllers/fileController.js
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/s3");
const FileMetadata = require("../models/FileMetadata");

async function uploadFile(req, res) {
  try {
    // If no file was provided
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file in request (profilePic)." });
    }

    // Extract original filename
    const originalName = req.file.originalname;
    const folderId = uuidv4();

    // "folderId/filename"
    const key = `${folderId}/${originalName}`;

    try {
      await s3.upload({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype || "application/octet-stream",
        }).promise();
    } catch (s3Error) {
      console.error("S3 upload failed:", s3Error);
      return res.status(500).json({ error: "S3 Upload Failed" });
    }

    // Construct "url"
    // "bucket-name/id/image-file.extension".
    const url = `${process.env.S3_BUCKET}/${key}`;


    let record;
  try {
    record = await FileMetadata.create({
      id: folderId,
      fileName: originalName,
      fileKey: key,
      url: url,
    });
  } catch (dbError) {
    console.error("DB record creation failed:", dbError);
    // Rollback: delete the uploaded file from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }).promise();
    } catch (rollbackError) {
      console.error("Rollback failed (S3 delete):", rollbackError);
    }
    return res.status(500).json({ error: "DB Record Creation Failed" });
  }

    // The Swagger says return 201 with:
    // {
    //   "file_name": "image.jpg",
    //   "id": "uuid",
    //   "url": "bucket-name/...",
    //   "upload_date": "2020-01-12"
    // }
    return res.status(201).json({
      id: record.id,
      file_name: record.fileName,
      url: record.url,
      // Since we rely on timestamps, we can map createdAt to "upload_date":
      upload_date: record.createdAt, // Or format it if needed
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /v1/file/{id}
async function getFile(req, res) {
  try {
    if (req.method === "HEAD") {
        return res.status(405).end();
      }
    const { id } = req.params;
    const record = await FileMetadata.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!record) {
      return res.status(404).json({ error: "File not found" });
    }
    return res.status(200).json({
      file_name: record.fileName,
      id: record.id,
      url: record.url,
      upload_date: record.createdAt,
    });
  } catch (err) {
    console.error("Error fetching file:", err);
    return res.status(404).json({ error: "File not found" });
  }
}

// DELETE /v1/file/{id}
async function deleteFile(req, res) {
    try {
      const { id } = req.params;
      const record = await FileMetadata.findByPk(id);
      if (!record) {
        return res.sendStatus(404);
      }
      // Delete from S3
      try {
        await s3.deleteObject({
          Bucket: process.env.S3_BUCKET,
          Key: record.fileKey,
        }).promise();
      } catch (s3DeleteError) {
        console.error("Error deleting file from S3:", s3DeleteError);
        return res.status(500).json({ error: "Failed to delete file from S3" });
      }
      // Delete DB record
      await record.destroy();
      return res.sendStatus(204);
    } catch (err) {
      console.error("Error deleting file:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};
