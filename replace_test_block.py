import re
import os

file_path = "src/__tests__/api.test.ts"

new_block = """  describe("getIssueLabels", () => {
    it("should return an empty array if no labels are found", async () => {
      const listLabelsMock = mock(() => Promise.resolve({ data: [] }));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toEqual([]);
      expect(listLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
      });
    });

    it("should handle malformed response", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listLabelsMock = mock(() => Promise.resolve({} as any));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error listing labels on issue:",
        expect.any(TypeError),
      );
    });

    it("should return labels for an issue", async () => {
      const listLabelsMock = mock(() =>
        Promise.resolve({ data: [{ name: "label1" }, { name: "label2" }] }),
      );
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toEqual(["label1", "label2"]);
      expect(listLabelsMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: issueNumber,
      });
    });

    it("should handle error when getting labels", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");
      const listLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error listing labels on issue:",
        error,
      );
    });

    it("should handle 404 Not Found error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      // Simulate Octokit error structure
      const error = { status: 404, message: "Not Found" };
      const listLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error listing labels on issue:",
        error,
      );
    });

    it("should handle 500 Internal Server Error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      // Simulate Octokit error structure
      const error = { status: 500, message: "Internal Server Error" };
      const listLabelsMock = mock(() => Promise.reject(error));
      const octokit = {
        rest: {
          issues: {
            listLabelsOnIssue: listLabelsMock,
          },
        },
      } as unknown as InstanceType<typeof GitHub>;

      const result = await getIssueLabels({
        octokit,
        owner,
        repo,
        issueNumber,
        body: "test",
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error listing labels on issue:",
        error,
      );
    });
  });"""

if not os.path.exists(file_path):
    print(f"Error: {file_path} does not exist.")
    exit(1)

with open(file_path, "r") as f:
    content = f.read()

# Try to find the block
# We look for describe("getIssueLabels" and matching closing brace? No too hard.
# We look for start marker and end marker.

start_marker = '  describe("getIssueLabels", () => {'
end_marker = '  describe("removeIssueLabel", () => {'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # We found the markers.
    # We replace from start_marker to end_marker (exclusive)
    # But wait, end_marker is the START of the next block.
    # So we replace up to end_marker.

    # Check if there is a closing brace before end_marker?
    # Actually, the block ends with "  });\n\n" usually.

    # Let's verify what we are replacing.
    existing_block = content[start_idx:end_idx]
    print("Found block:")
    print(existing_block[:50] + "..." + existing_block[-50:])

    new_content = content[:start_idx] + new_block + "\n\n" + content[end_idx:]

    with open(file_path, "w") as f:
        f.write(new_content)
    print("Successfully replaced getIssueLabels block.")
else:
    print("Could not find the block boundaries.")
    print(f"Start index: {start_idx}")
    print(f"End index: {end_idx}")
