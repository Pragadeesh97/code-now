"use strict";
// HTTP API to copy the base files from S3 template location to the folder for the project
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = exports.BUCKET_NAME = void 0;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables
exports.BUCKET_NAME = "code-now";
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
aws_sdk_1.default.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: "eu-west-3",
});
exports.s3 = new aws_sdk_1.default.S3();
app.use((0, express_1.json)());
app.get("/", (req, res) => {
    console.log("health check app", req);
    res.status(200).send("App is running");
});
const projectSchema = zod_1.z.object({
    project_name: zod_1.z.string(),
    env: zod_1.z.enum(["node", "python"]),
});
app.post("/project", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    console.log("create project endpoint hit", data);
    if (!projectSchema.safeParse(data).success) {
        return res.status(400).send({ message: "Invalid data" });
    }
    try {
        const bucketData = yield exports.s3
            .listObjectsV2({
            Bucket: exports.BUCKET_NAME,
            Delimiter: "/",
            Prefix: "projects/",
        })
            .promise();
        const folders = (bucketData === null || bucketData === void 0 ? void 0 : bucketData.CommonPrefixes) &&
            (bucketData === null || bucketData === void 0 ? void 0 : bucketData.CommonPrefixes.map((prefix) => prefix.Prefix));
        console.log("Folders:", folders);
        if (folders &&
            folders.length > 0 &&
            folders.includes(`projects/${data.project_name}/`)) {
            return res.status(400).send({
                message: "Project name already taken, please try with a different one.",
            });
        }
    }
    catch (err) {
        console.error(`Error listing folders: ${err}`);
        return res
            .status(500)
            .send({ message: "Some error occured, please try later" });
    }
    try {
        const copy_data = yield exports.s3
            .listObjectsV2({
            Bucket: exports.BUCKET_NAME,
            Prefix: `template/${data.env}/`,
        })
            .promise();
        console.log("copy data", copy_data, copy_data.Contents);
        if (copy_data.Contents) {
            for (const obj of copy_data.Contents) {
                const obj_key = obj.Key ? obj.Key : "";
                try {
                    console.log("Copying for key - ", `${exports.BUCKET_NAME}/${obj.Key}`);
                    yield exports.s3
                        .copyObject({
                        Bucket: exports.BUCKET_NAME,
                        Key: `projects/${data.project_name}/${obj_key.substring(`template/${data.env}/`.length)}`,
                        CopySource: `${exports.BUCKET_NAME}/${obj_key}`,
                    })
                        .promise();
                    console.log(`Copied ${obj_key} to projects/${data.project_name}/`);
                }
                catch (err) {
                    console.error(`Error copying ${obj_key}:`, err);
                    throw err; // Rethrow to stop further processing or handle as needed
                }
            }
            console.log(`Contents copied for project env - ${data.env} successfully`);
            res.status(201).send({ message: "Project created." });
        }
    }
    catch (err) {
        console.log("Error while creating project for user", err);
        return res
            .status(500)
            .send({ message: "Some error occured, please try later" });
    }
}));
httpServer.listen(3000, () => console.log("HTTP API server is up and running"));
