import fs from "fs";
import path from "path";
import aws from "aws-sdk";
export const BUCKET_NAME = "code-now";
export const s3 = new aws.S3();

export async function downloadS3ContentToLocal(
  object_path: string,
  project_name: any
) {
  try {
    const s3_objects = await s3
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: object_path,
      })
      .promise();

    if (s3_objects.Contents) {
      for (const content of s3_objects.Contents) {
        const content_key = content && content.Key ? content.Key : "";
        if (!content_key.endsWith("/")) {
          const getObjectParams = {
            Bucket: BUCKET_NAME ?? "",
            Key: content_key,
          };

          const data = await s3.getObject(getObjectParams).promise();
          if (data.Body) {
            const fileData = data.Body;
            const filePath = `${
              process.env.COPY_DIRECTORY_PATH
            }/${content_key.replace(object_path, "")}`;

            //@ts-ignore
            await writeToFile(filePath, fileData);
          }
        }
      }
    } else {
      console.log("Directory is empty in s3");
    }
  } catch (e) {
    console.log("Error while downloading the files from s3", e);
  }
}

export function writeToFile(filePath: string, fileData: Buffer): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await createFolder(path.dirname(filePath));

    fs.writeFile(filePath, fileData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function createFolder(dirName: string) {
  return new Promise<void>((resolve, reject) => {
    fs.mkdir(dirName, { recursive: true }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

interface resultType {
  type: String;
  name: String;
  path: String;
}
export function fetchRootDirectories(project_name: any) {
  const resultArr: Array<resultType> = [];
  const COPY_DIRECTORY_PATH = process.env.COPY_DIRECTORY_PATH || "../workspace";
  const items = fs.readdirSync(COPY_DIRECTORY_PATH + "", {
    withFileTypes: true,
  });
  items.forEach((item) => {
    let result: resultType = { type: "", name: "", path: "" };
    result["type"] = item.isFile() ? "file" : "dir";
    result["name"] = item.name;
    result["path"] = "/" + item.name;
    resultArr.push(result);
  });
  return resultArr;
}

export function fetchContent(project_name: string, filePath: string) {
  const content = fs.readFileSync(
    process.env.COPY_DIRECTORY_PATH + filePath,
    "utf-8"
  );
  content.toString();
  return content;
}

export const fetchDirectories = (dir: string, baseDir: string) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (files) {
        if (err) {
          reject(err);
        } else {
          resolve(
            files.map((file) => ({
              type: file.isDirectory() ? "dir" : "file",
              name: file.name,
              path: `${baseDir}/${file.name}`,
            }))
          );
        }
      }
    });
  });
};
