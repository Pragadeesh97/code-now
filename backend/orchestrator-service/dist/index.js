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
// Responsible for creating the pod, ingress and the import express from "express";
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const client_node_1 = require("@kubernetes/client-node");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const kubeconfig = new client_node_1.KubeConfig();
kubeconfig.loadFromDefault();
const coreV1Api = kubeconfig.makeApiClient(client_node_1.CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(client_node_1.AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(client_node_1.NetworkingV1Api);
const readAndParseKubeYaml = (filePath, project_name) => {
    const fileContent = fs_1.default.readFileSync(filePath, "utf8");
    const docs = yaml_1.default.parseAllDocuments(fileContent).map((doc) => {
        let docString = doc.toString();
        const service_regex = new RegExp(`service_name`, "g");
        docString = docString.replace(service_regex, project_name);
        console.log(docString);
        return yaml_1.default.parse(docString);
    });
    return docs;
};
app.post("/start", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { project } = req.body;
    const namespace = "default"; // Assuming a default namespace
    try {
        const kubeManifests = readAndParseKubeYaml(path_1.default.join(__dirname, "../orchestration-service.yaml"), project);
        console.log("kube Manifest is", kubeManifests);
        for (const manifest of kubeManifests) {
            console.log("kind of the manifest is ", manifest.kind);
            switch (manifest.kind) {
                case "Deployment":
                    yield appsV1Api.createNamespacedDeployment(namespace, manifest);
                    break;
                case "Service":
                    try {
                        yield coreV1Api.createNamespacedService(namespace, manifest);
                    }
                    catch (error) {
                        const apiError = error;
                        if ((_c = (_b = (_a = apiError === null || apiError === void 0 ? void 0 : apiError.response) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.includes("already exists")) {
                            console.log(`Service already exists. Attempting to update...`);
                        }
                    }
                    break;
                case "Ingress":
                    yield networkingV1Api.createNamespacedIngress(namespace, manifest);
                    break;
                default:
                    console.log(`Unsupported kind: ${manifest.kind}`);
            }
        }
        res.status(200).send({ message: "Resources created successfully" });
    }
    catch (error) {
        console.error("Failed to create resources", error);
        //res.status(500).send({ message: "Failed to create resources" });
    }
    //res.status(200).send({ message: "Resources created successfully" });
}));
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Orchestrator service running: ${port}`);
});
