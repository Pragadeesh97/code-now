// Responsible for creating the pod, ingress and the import express from "express";
import express from "express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import cors from "cors";
import {
  KubeConfig,
  AppsV1Api,
  CoreV1Api,
  NetworkingV1Api,
} from "@kubernetes/client-node";

const app = express();
app.use(express.json());
app.use(cors());

const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault();
const coreV1Api = kubeconfig.makeApiClient(CoreV1Api);
const appsV1Api = kubeconfig.makeApiClient(AppsV1Api);
const networkingV1Api = kubeconfig.makeApiClient(NetworkingV1Api);

const readAndParseKubeYaml = (
  filePath: string,
  project_name: string
): Array<any> => {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const docs = yaml.parseAllDocuments(fileContent).map((doc) => {
    let docString = doc.toString();
    const service_regex = new RegExp(`service_name`, "g");
    docString = docString.replace(service_regex, project_name);
    return yaml.parse(docString);
  });
  return docs;
};

interface ApiError {
  response?: {
    body?: {
      message?: string;
    };
  };
}

app.post("/start", async (req, res) => {
  const { project } = req.body;
  const namespace = "default"; // Assuming a default namespace

  try {
    const kubeManifests = readAndParseKubeYaml(
      path.join(__dirname, "../orchestration-service.yaml"),
      project
    );
    for (const manifest of kubeManifests) {
      switch (manifest.kind) {
        case "Deployment":
          await appsV1Api.createNamespacedDeployment(namespace, manifest);
          break;
        case "Service":
          try {
            await coreV1Api.createNamespacedService(namespace, manifest);
          } catch (error) {
            const apiError = error as ApiError;
            if (apiError?.response?.body?.message?.includes("already exists")) {
              console.log(`Service already exists. Attempt to update...`);
            }
          }
          break;
        case "Ingress":
          await networkingV1Api.createNamespacedIngress(namespace, manifest);
          break;
        default:
          console.log(`Unsupported kind: ${manifest.kind}`);
      }
    }
    res.status(200).send({ message: "Resources created successfully" });
  } catch (error) {
    console.error("Failed to create resources", error);
    //res.status(500).send({ message: "Failed to create resources" });
  }
  //res.status(200).send({ message: "Resources created successfully" });
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Orchestrator service running: ${port}`);
});
