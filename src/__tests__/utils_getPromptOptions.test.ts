import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as path from "path";

const readFileSyncMock = mock();

mock.module("fs", () => {
  return {
    readFileSync: readFileSyncMock,
  };
});

import { getPromptOptions } from "../utils";

describe("getPromptOptions error paths", () => {
  beforeEach(() => {
    readFileSyncMock.mockReset();
  });

  it("should throw error if file reading fails", () => {
    readFileSyncMock.mockImplementation(() => {
      throw new Error("ENOENT: no such file or directory");
    });

    expect(() => {
      getPromptOptions("non-existent.yml", ".");
    }).toThrow("ENOENT: no such file or directory");
  });

  it("should throw error if file content is empty", () => {
    readFileSyncMock.mockReturnValue("");

    expect(() => {
      getPromptOptions("empty.yml", ".");
    }).toThrow("System prompt file not found: empty.yml");
  });

  it("should throw error if YAML parsing fails", () => {
    readFileSyncMock.mockReturnValue("\tinvalid: yaml");

    expect(() => {
      getPromptOptions("invalid.yml", ".");
    }).toThrow("Unable to parse system prompt file");
  });

  it("should throw error if YAML is not an object or messages array missing", () => {
    readFileSyncMock.mockReturnValue("some: value");

    expect(() => {
      getPromptOptions("no-messages.yml", ".");
    }).toThrow("Unable to parse system prompt file: Invalid YAML format in the prompt file");
  });

  it("should throw error if messages is not an array", () => {
    readFileSyncMock.mockReturnValue("messages: not-an-array");

    expect(() => {
      getPromptOptions("invalid-messages.yml", ".");
    }).toThrow("Unable to parse system prompt file: Invalid YAML format in the prompt file");
  });

  it("should throw error if system message is missing", () => {
    readFileSyncMock.mockReturnValue("messages:\n  - role: user\n    content: hi");

    expect(() => {
      getPromptOptions("no-system.yml", ".");
    }).toThrow("Unable to parse system prompt file: System message not found in the prompt file");
  });

  it("should throw error if system message content is missing", () => {
    readFileSyncMock.mockReturnValue("messages:\n  - role: system");

    expect(() => {
      getPromptOptions("empty-system.yml", ".");
    }).toThrow("Unable to parse system prompt file: System message not found in the prompt file");
  });

  it("should throw error for path traversal attempts", () => {
    const promptFile = "../../../etc/passwd";
    const promptsDirectory = "prompts";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should throw error for absolute path", () => {
    const promptFile = "/etc/passwd";
    const promptsDirectory = "prompts";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should throw error for absolute path that seems safe but is absolute", () => {
    // Even if it starts with the prompts directory, if it's absolute it should be rejected if we want to enforce relative paths for the second argument of our resolution logic to be safe.
    // In our implementation, path.isAbsolute(promptFile) will catch this.
    const promptsDirectory = "prompts";
    const resolvedPromptsDir = path.resolve(process.cwd(), promptsDirectory);
    const promptFile = path.join(resolvedPromptsDir, "test.yml");

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });
});
