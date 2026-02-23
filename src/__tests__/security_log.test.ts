import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { getAILabelAssessmentValue, sanitizeLog } from "../utils";

describe("Log Injection Security", () => {
  const consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});

  afterEach(() => {
    consoleLogSpy.mockClear();
  });

  describe("sanitizeLog", () => {
    it("should remove newlines", () => {
      const input = "User input\nInjected log";
      expect(sanitizeLog(input)).toBe("User input\\nInjected log");
    });

    it("should remove carriage returns", () => {
      const input = "User input\rInjected log";
      expect(sanitizeLog(input)).toBe("User input\\rInjected log");
    });

    it("should handle mixed control characters", () => {
        const input = "User\n\rInput";
        expect(sanitizeLog(input)).toBe("User\\n\\rInput");
    });

    it("should escape quotes", () => {
        const input = 'User "input"';
        expect(sanitizeLog(input)).toBe('User \\"input\\"');
    });
  });

  describe("getAILabelAssessmentValue logging", () => {
    it("should log sanitized assessment with tab", () => {
      const aiResponse = "### Assessment: Malicious\tInput";
      const regex = /### Assessment: (.*)/;
      getAILabelAssessmentValue("test.prompt.yml", aiResponse, regex);

      // tab is matched by dot, so it is part of matched string.
      // sanitizeLog escapes \t to \t
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Assessment found: malicious\\tinput"));
    });
  });
});
