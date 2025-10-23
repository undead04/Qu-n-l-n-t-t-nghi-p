'use strict'

import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from "@aws-sdk/client-s3"
import config from '../configs/config'

const s3Config = new S3Client({
    region: config.awsRegion,
    credentials: {
        accessKeyId: config.awsAccessKeyId||"",
        secretAccessKey: config.awsSecretAccessKey||""
    }
});

export {PutObjectCommand,GetObjectCommand,DeleteObjectCommand,s3Config}