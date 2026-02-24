import { describe, it, expect, mock, beforeEach } from "bun:test";

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
});
