// src/controllers/fileController.js
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/s3");
const FileMetadata = require("../models/FileMetadata");
const { logger } = require("../../middlewares/metricsLogger");

async function uploadFile(req, res) {
  try {
    // If no file was provided
    if (!req.file) {
        logger.warn("Upload attempt without a file");
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
        logger.info(`S3 upload successful for ${key}`);
    } catch (s3Error) {
      logger.error("S3 upload failed:", s3Error);
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
    logger.info(`DB record created for file ${originalName} with id ${folderId}`);
  } catch (dbError) {
    logger.error(`DB record creation failed for ${originalName}: ${dbError}`);
    // Rollback: delete the uploaded file from S3
    try {
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }).promise();
      logger.info(`Rollback: S3 object deleted for ${key}`);
    } catch (rollbackError) {
        logger.error(`Rollback failed (S3 delete) for ${key}: ${rollbackError}`);
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
    logger.error(`Unexpected error in uploadFile: ${err}`);
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
        logger.warn(`File not found with id ${id}`);
      return res.status(404).json({ error: "File not found" });
    }
    logger.info(`File retrieved with id ${id}`);
    return res.status(200).json({
      file_name: record.fileName,
      id: record.id,
      url: record.url,
      upload_date: record.createdAt,
    });
    
  } catch (err) {
    logger.error(`Error fetching file with id ${req.params.id}: ${err}`);
    return res.status(404).json({ error: "File not found" });
  }
}

// DELETE /v1/file/{id}
async function deleteFile(req, res) {
    try {
      const { id } = req.params;
      const record = await FileMetadata.findByPk(id);
      if (!record) {
        logger.warn(`Delete attempt for non-existent file id ${id}`);
        return res.sendStatus(404);
      }
      // Delete from S3
      try {
        await s3.deleteObject({
          Bucket: process.env.S3_BUCKET,
          Key: record.fileKey,
        }).promise();
        logger.info(`S3 deletion successful for file key ${record.fileKey}`);
      } catch (s3DeleteError) {
        logger.error(`S3 deletion failed for file key ${record.fileKey}: ${s3DeleteError}`);
        return res.status(500).json({ error: "Failed to delete file from S3" });
      }
      // Delete DB record
      await record.destroy();
      logger.info(`DB record deleted for file id ${id}`);
      return res.sendStatus(204);
    } catch (err) {
        logger.error(`Error deleting file with id ${req.params.id}: ${err}`);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};
