import dotenv from "dotenv";
dotenv.config();

const config = {
  awsRegion: process.env.AWS_REGION || "us-east-1",
  awsAccessKeyId: process.env.AWS_BUCKET_ACESS_KEY || "AKIAIOSFODNN7EXAMPLE",
  awsSecretAccessKey:
    process.env.AWS_BUCKET_SECRET_KEY ||
    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  awsBucketName: process.env.AWS_BUCKET_NAME || "my-bucket-name",
  awsKeyGroup: process.env.AWS_KEY_GROUP || "my-key-group",
  awsPrivateKey: process.env.AWS_PRIVATE_KEY || "my-private-key",
  urlImagePublic:
    process.env.URL_IMAGE_PUBLIC || "https://my-bucket-name.s3.amazonaws.com/",
};

export default config;
