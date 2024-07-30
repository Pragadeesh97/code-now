"use strict";
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
exports.fetchDirectories = exports.fetchContent = exports.fetchRootDirectories = exports.writeToFile = exports.downloadS3ContentToLocal = void 0;
const index_1 = require("./index");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function downloadS3ContentToLocal(object_path, project_name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Inside the downloadS3ContentToLocal function", object_path, project_name);
            const s3_objects = yield index_1.s3
                .listObjectsV2({
                Bucket: index_1.BUCKET_NAME,
                Prefix: object_path,
            })
                .promise();
            if (s3_objects.Contents) {
                for (const content of s3_objects.Contents) {
                    const content_key = content && content.Key ? content.Key : "";
                    if (!content_key.endsWith("/")) {
                        const getObjectParams = {
                            Bucket: index_1.BUCKET_NAME !== null && index_1.BUCKET_NAME !== void 0 ? index_1.BUCKET_NAME : "",
                            Key: content_key,
                        };
                        const data = yield index_1.s3.getObject(getObjectParams).promise();
                        console.log("process.env.COPY_DIRECTORY_PATH", process.env.COPY_DIRECTORY_PATH);
                        if (data.Body) {
                            const fileData = data.Body;
                            const filePath = `${process.env.COPY_DIRECTORY_PATH}/${project_name}${content_key.replace(object_path, "")}`;
                            console.log("filePath to create the folder", filePath);
                            //@ts-ignore
                            yield writeToFile(filePath, fileData);
                            console.log(`Downloaded ${content_key} to ${filePath}`);
                        }
                    }
                }
            }
            else {
                console.log("Directory is empty in s3");
            }
        }
        catch (e) {
            console.log("Error while downloading the files from s3", e);
        }
    });
}
exports.downloadS3ContentToLocal = downloadS3ContentToLocal;
function writeToFile(filePath, fileData) {
    console.log("write to file called with Data - ", fileData);
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        yield createFolder(path_1.default.dirname(filePath));
        fs_1.default.writeFile(filePath, fileData, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    }));
}
exports.writeToFile = writeToFile;
function createFolder(dirName) {
    return new Promise((resolve, reject) => {
        fs_1.default.mkdir(dirName, { recursive: true }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
function fetchRootDirectories(project_name) {
    const resultArr = [];
    const items = fs_1.default.readdirSync(process.env.COPY_DIRECTORY_PATH + "/" + project_name, { withFileTypes: true });
    items.forEach((item) => {
        let result = { type: "", name: "", path: "" };
        console.log("Item in directory", item);
        result["type"] = item.isFile() ? "file" : "dir";
        result["name"] = item.name;
        result["path"] = "/" + item.name;
        resultArr.push(result);
    });
    return resultArr;
}
exports.fetchRootDirectories = fetchRootDirectories;
function fetchContent(project_name, filePath) {
    console.log("process.env.COPY_DIRECTORY_PATH in fetchContent", process.env.COPY_DIRECTORY_PATH);
    const content = fs_1.default.readFileSync(process.env.COPY_DIRECTORY_PATH + "/" + project_name + filePath, "utf-8");
    content.toString();
    return content;
}
exports.fetchContent = fetchContent;
const fetchDirectories = (dir, baseDir) => {
    return new Promise((resolve, reject) => {
        fs_1.default.readdir(dir, { withFileTypes: true }, (err, files) => {
            if (files) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(files.map((file) => ({
                        type: file.isDirectory() ? "dir" : "file",
                        name: file.name,
                        path: `${baseDir}/${file.name}`,
                    })));
                }
            }
        });
    });
};
exports.fetchDirectories = fetchDirectories;
