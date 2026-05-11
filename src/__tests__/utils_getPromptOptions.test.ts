import { describe, it, expect, mock, beforeEach } from "bun:test";

const readFileMock = mock();

mock.module("fs", () => {
  return {
    promises: {
      readFile: readFileMock,
    },
  };
});

import { getPromptOptions } from "../utils";

describe("getPromptOptions error paths", () => {
  beforeEach(() => {
    readFileMock.mockReset();
  });

  it("should throw error if file reading fails", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT: no such file or directory"));

    await expect(
      getPromptOptions("non-existent.yml", "."),
    ).rejects.toThrow("ENOENT: no such file or directory");
  });

  it("should throw error if file content is empty", async () => {
    readFileMock.mockResolvedValue("");

    await expect(
      getPromptOptions("empty.yml", "."),
    ).rejects.toThrow("System prompt file not found: empty.yml");
  });

  it("should throw error if YAML parsing fails", async () => {
    readFileMock.mockResolvedValue("\tinvalid: yaml");

    await expect(
      getPromptOptions("invalid.yml", "."),
    ).rejects.toThrow("Unable to parse system prompt file");
  });

  it("should throw error if YAML is not an object or messages array missing", async () => {
    readFileMock.mockResolvedValue("some: value");

    await expect(
      getPromptOptions("no-messages.yml", "."),
    ).rejects.toThrow("Unable to parse system prompt file: Invalid YAML format in the prompt file");
  });

  it("should throw error if messages is not an array", async () => {
    readFileMock.mockResolvedValue("messages: not-an-array");

    await expect(
      getPromptOptions("invalid-messages.yml", "."),
    ).rejects.toThrow("Unable to parse system prompt file: Invalid YAML format in the prompt file");
  });

  it("should throw error if system message is missing", async () => {
    readFileMock.mockResolvedValue("messages:\n  - role: user\n    content: hi");

    await expect(
      getPromptOptions("no-system.yml", "."),
    ).rejects.toThrow("Unable to parse system prompt file: System message not found in the prompt file");
  });

  it("should throw error if system message content is missing", async () => {
    readFileMock.mockResolvedValue("messages:\n  - role: system");

    await expect(
      getPromptOptions("empty-system.yml", "."),
    ).rejects.toThrow("Unable to parse system prompt file: System message not found in the prompt file");
  });

  it("should throw error for path traversal attempts", async () => {
    const promptFile = "../../../etc/passwd";
    const promptsDirectory = "prompts";

    await expect(
      getPromptOptions(promptFile, promptsDirectory),
    ).rejects.toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileMock).not.toHaveBeenCalled();
  });
});
