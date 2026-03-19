import * as core from "@actions/core";
import { isUnexpected } from "@azure-rest/ai-inference";
import type { AiInferenceFn } from "./types";

export const aiInference: AiInferenceFn = async ({
  systemPromptMsg,
  endpoint,
  client,
  modelName,
  maxTokens,
  content,
}) => {
  try {
    core.info("AI configuration:");
    core.info(`Endpoint: ${endpoint}`);
    core.info(`Model: ${modelName}`);
    core.info(`Max Tokens: ${maxTokens}`);

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: "system",
            content: systemPromptMsg,
          },
          { role: "user", content },
        ],
        max_tokens: maxTokens,
        model: modelName,
      },
    });

    if (isUnexpected(response)) {
      if (response.body.error) {
        throw response.body.error;
      }
      throw new Error(
        "An error occurred while fetching the response (" +
          response.status +
          "): " +
          response.body,
      );
    }

    const modelResponse: string | null =
      response.body.choices[0].message.content;

    return modelResponse ?? undefined;
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
};
