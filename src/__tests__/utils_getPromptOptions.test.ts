import { describe, it, expect, mock, beforeEach } from "bun:test";

const readFileSyncMock = mock();

mock.module("fs", () => {
  return {
    readFileSync: readFileSyncMock,
    promises: {
      readFile: mock(),
    },
  };
});

mock.module("@actions/core", () => ({
  summary: {
    addHeading: mock(function (this: any) {
      return this;
    }),
    addCodeBlock: mock(function (this: any) {
      return this;
    }),
    write: mock(function (this: any) {
      return this;
    }),
  },
}));

mock.module("js-yaml", () => ({
  default: {
    load: mock(),
  },
}));

import { getPromptOptions } from "../utils";
import yaml from "js-yaml";

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
    (yaml.load as any).mockImplementation(() => {
      throw new Error("YAML error");
    });

    expect(() => {
      getPromptOptions("invalid.yml", ".");
    }).toThrow("Unable to parse system prompt file");
  });

  it("should throw error if YAML is not an object or messages array missing", () => {
    readFileSyncMock.mockReturnValue("some: value");
    (yaml.load as any).mockReturnValue({ some: "value" });

    expect(() => {
      getPromptOptions("no-messages.yml", ".");
    }).toThrow(
      "Unable to parse system prompt file: Invalid YAML format in the prompt file",
    );
  });

  it("should throw error if messages is not an array", () => {
    readFileSyncMock.mockReturnValue("messages: not-an-array");
    (yaml.load as any).mockReturnValue({ messages: "not-an-array" });

    expect(() => {
      getPromptOptions("invalid-messages.yml", ".");
    }).toThrow(
      "Unable to parse system prompt file: Invalid YAML format in the prompt file",
    );
  });

  it("should throw error if system message is missing", () => {
    readFileSyncMock.mockReturnValue("messages:\n  - role: user\n    content: hi");
    (yaml.load as any).mockReturnValue({
      messages: [{ role: "user", content: "hi" }],
    });

    expect(() => {
      getPromptOptions("no-system.yml", ".");
    }).toThrow(
      "Unable to parse system prompt file: System message not found in the prompt file",
    );
  });

  it("should throw error if system message content is missing", () => {
    readFileSyncMock.mockReturnValue("messages:\n  - role: system");
    (yaml.load as any).mockReturnValue({
      messages: [{ role: "system" }],
    });

    expect(() => {
      getPromptOptions("empty-system.yml", ".");
    }).toThrow(
      "Unable to parse system prompt file: System message not found in the prompt file",
    );
  });

  it("should throw error for path traversal attempts in promptFile", () => {
    const promptFile = "../../../etc/passwd";
    const promptsDirectory = "prompts";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should throw error if promptsDirectory is an absolute path", () => {
    const promptFile = "security.prompt.yml";
    const promptsDirectory = "/etc";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompts directory: ${promptsDirectory}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should throw error if promptFile is an absolute path", () => {
    const promptFile = "/etc/passwd";
    const promptsDirectory = "prompts";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompt file path: ${promptFile}`);

    expect(readFileSyncMock).not.toHaveBeenCalled();
  });

  it("should throw error if promptsDirectory attempts traversal", () => {
    const promptFile = "security.prompt.yml";
    const promptsDirectory = "../outside";

    expect(() => {
      getPromptOptions(promptFile, promptsDirectory);
    }).toThrow(`Invalid prompts directory: ${promptsDirectory}`);
  });
});
