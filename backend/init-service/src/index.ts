// HTTP API to copy the base files from S3 template location to the folder for the project

import express, { json } from "express";
import cors from "cors";
import { z } from "zod";
import aws from "aws-sdk";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export const BUCKET_NAME = "code-now";

const app = express();
app.use(cors());

const httpServer = createServer(app);

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: "eu-west-3",
});

export const s3 = new aws.S3();

app.use(json());

app.get("/", (req, res) => {
  res.status(200).send("Health check endpoint. Init app is up and running");
});

const projectSchema = z.object({
  project_name: z.string(),
  env: z.enum(["node", "python"]),
});

app.post("/project", async (req, res) => {
  const data = req.body;
  if (!projectSchema.safeParse(data).success) {
    return res.status(400).send({ message: "Invalid data" });
  }
  try {
    const bucketData = await s3
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Delimiter: "/",
        Prefix: "projects/",
      })
      .promise();
    const folders =
      bucketData?.CommonPrefixes &&
      bucketData?.CommonPrefixes.map((prefix) => prefix.Prefix);

    if (
      folders &&
      folders.length > 0 &&
      folders.includes(`projects/${data.project_name}/`)
    ) {
      return res.status(400).send({
        message: "Project name already taken, please try with a different one.",
      });
    }
  } catch (err) {
    console.error(`Error listing folders: ${err}`);
    return res
      .status(500)
      .send({ message: "Some error occured, please try later" });
  }
  try {
    const copy_data = await s3
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: `template/${data.env}/`,
      })
      .promise();

    if (copy_data.Contents) {
      for (const obj of copy_data.Contents) {
        const obj_key = obj.Key ? obj.Key : "";
        try {
          await s3
            .copyObject({
              Bucket: BUCKET_NAME,
              Key: `projects/${data.project_name}/${obj_key.substring(
                `template/${data.env}/`.length
              )}`,
              CopySource: `${BUCKET_NAME}/${obj_key}`,
            })
            .promise();
        } catch (err) {
          console.error(`Error copying ${obj_key}:`, err);
          throw err; // Rethrow to stop further processing or handle as needed
        }
      }
      res.status(201).send({ message: "Project created." });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Some error occured, please try later" });
  }
});

httpServer.listen(3000, () =>
  console.log("HTTP API server for creating the project is up and running")
);
