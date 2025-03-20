// src/models/FileMetadata.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FileMetadata = sequelize.define(
  "FileMetadata",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "file_metadata",
    timestamps: true, // will give createdAt and updatedAt
  }
);

module.exports = FileMetadata;
