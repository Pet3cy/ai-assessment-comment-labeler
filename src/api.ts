import { error as logError, info } from "@actions/core";
import type {
  CreateIssueCommentFn,
  GetIssueLabelsFn,
  AddIssueLabelsFn,
  RemoveIssueLabelFn,
} from "./types";

export const createIssueComment: CreateIssueCommentFn = async ({
  octokit,
  owner,
  repo,
  issueNumber: issue_number,
  body,
}) => {
  try {
    const response = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
    if (response.status === 201) {
      info(`Comment created successfully: ${response.data.html_url}`);
      return true;
    } else {
      logError(`Failed to create comment: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(
      `Error creating issue comment: ${error instanceof Error ? error.stack || error.message : error}`,
    );
    return false;
  }
};

export const getIssueLabels: GetIssueLabelsFn = async ({
  octokit,
  owner,
  repo,
  issueNumber: issue_number,
}) => {
  try {
    const response = await octokit.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number,
    });
    return response.data.map((label) => label.name);
  } catch (error) {
    logError(
      `Error listing labels on issue: ${error instanceof Error ? error.stack || error.message : error}`,
    );
  }
};

export const addIssueLabels: AddIssueLabelsFn = async ({
  octokit,
  owner,
  repo,
  issueNumber: issue_number,
  labels,
}) => {
  try {
    await octokit.rest.issues.addLabels({ owner, repo, issue_number, labels });
  } catch (error) {
    logError(
      `Error adding labels to issue: ${error instanceof Error ? error.stack || error.message : error}`,
    );
  }
};

export const removeIssueLabel: RemoveIssueLabelFn = async ({
  octokit,
  owner,
  repo,
  issueNumber: issue_number,
  label,
}) => {
  try {
    await octokit.rest.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: label,
    });
    info(`Label "${label}" removed from issue #${issue_number}`);
  } catch (error) {
    logError(
      `Error removing labels from issue: ${error instanceof Error ? error.stack || error.message : error}`,
    );
  }
};
