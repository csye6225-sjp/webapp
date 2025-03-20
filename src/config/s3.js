const AWS = require("aws-sdk");

// AWS SDK will use the EC2 instance role automatically if no creds are specified
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "us-east-1"
});

module.exports = s3;
