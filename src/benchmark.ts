import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://example.com";
const token = "fake-token";

function measureCreation() {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
  }
  const end = performance.now();
  console.log(`Creation of 10000 clients took ${end - start}ms`);
}

measureCreation();
