import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TestRailClient } from "../../client/api/index.js";
import { createSuccessResponse, createErrorResponse } from "./utils.js";
import {
	getResultsSchema,
	getResultsForCaseSchema,
	getResultsForRunSchema,
	addResultForCaseSchema,
	addResultsForCasesSchema,
	addAttachmentToResultSchema,
	deleteAttachmentSchema,
} from "../../shared/schemas/results.js";

/**
 * Function to register test result-related API tools
 * @param server McpServer instance
 * @param testRailClient TestRail client instance
 */
export function registerResultTools(
	server: McpServer,
	testRailClient: TestRailClient,
): void {
	// Add a file attachment to an existing test result
	server.tool(
		"addAttachmentToResult",
		"Adds a file attachment (e.g. a screenshot) to an existing test result / 既存のテスト結果にファイル添付を追加します. Provide the absolute path to a file already saved on disk; the file is uploaded as-is.",
		addAttachmentToResultSchema,
		async ({ resultId, filePath, filename }) => {
			try {
				const response = await testRailClient.results.addAttachmentToResult(
					resultId,
					filePath,
					filename,
				);
				const successResponse = createSuccessResponse(
					"Attachment added successfully",
					{
						response,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error adding attachment to result ${resultId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Delete an existing attachment by ID
	server.tool(
		"deleteAttachment",
		"Deletes an existing attachment (e.g. a screenshot) from TestRail by its attachment ID / 添付ファイルを削除します. Permanent and cannot be undone. Requires TestRail 5.7+.",
		deleteAttachmentSchema,
		async ({ attachmentId }) => {
			try {
				await testRailClient.results.deleteAttachment(attachmentId);
				const successResponse = createSuccessResponse(
					"Attachment deleted successfully",
					{
						attachmentId,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error deleting attachment ${attachmentId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Get test results for a test
	server.tool(
		"getResults",
		"Retrieves test results for a specific test / 特定のテストのテスト結果を取得します",
		getResultsSchema,
		async ({ testId, ...filters }) => {
			try {
				const results = await testRailClient.results.getResults(
					testId,
					filters,
				);
				const successResponse = createSuccessResponse(
					"Results retrieved successfully",
					{
						results,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error fetching results for test ${testId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Get test results for a specific test case in a run
	server.tool(
		"getResultsForCase",
		"Retrieves test results for a specific test case in a test run / テスト実行内の特定のテストケースのテスト結果を取得します",
		getResultsForCaseSchema,
		async ({ runId, caseId, ...filters }) => {
			try {
				const results = await testRailClient.results.getResultsForCase(
					runId,
					caseId,
					filters,
				);
				const successResponse = createSuccessResponse(
					"Results retrieved successfully",
					{
						results,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error fetching results for run ${runId} and case ${caseId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Get all test results for a test run
	server.tool(
		"getResultsForRun",
		"Retrieves all test results for a test run / テスト実行の全テスト結果を取得します",
		getResultsForRunSchema,
		async ({ runId, ...filters }) => {
			try {
				const results = await testRailClient.results.getResultsForRun(
					runId,
					filters,
				);
				const successResponse = createSuccessResponse(
					"Results retrieved successfully",
					{
						results,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error fetching results for run ${runId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Add a result for a specific test case in a run
	server.tool(
		"addResultForCase",
		"Adds a test result for a specific test case in a test run / テスト実行内の特定のテストケースにテスト結果を追加します. If the project's test case template requires custom fields (e.g. custom_step_results for step-by-step results, custom_environment, custom_staging_study_runner_instance) use customFields to pass them - omitting fields the template requires will cause the API to return a 400 error.",
		addResultForCaseSchema,
		async ({ runId, caseId, customFields, ...resultData }) => {
			try {
				// Prepare result data
				const data: Record<string, unknown> = {};

				// Add status ID if specified
				if (resultData.statusId) {
					data.status_id = resultData.statusId;
				}

				// Add comment if specified
				if (resultData.comment) {
					data.comment = resultData.comment;
				}

				// Add version if specified
				if (resultData.version) {
					data.version = resultData.version;
				}

				// Add elapsed time if specified
				if (resultData.elapsed) {
					data.elapsed = resultData.elapsed;
				}

				// Add defects if specified
				if (resultData.defects) {
					data.defects = resultData.defects;
				}

				// Add assignee ID if specified
				if (resultData.assignedtoId) {
					data.assignedto_id = resultData.assignedtoId;
				}

				// Add additional custom fields from customFields object
				if (customFields) {
					for (const [key, value] of Object.entries(customFields)) {
						data[key] = value;
					}
				}

				const result = await testRailClient.results.addResultForCase(
					runId,
					caseId,
					data,
				);
				const successResponse = createSuccessResponse(
					"Result added successfully",
					{
						result,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error adding result for run ${runId} and case ${caseId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);

	// Add results for multiple test cases
	server.tool(
		"addResultsForCases",
		"Adds test results for multiple test cases in a test run / テスト実行内の複数のテストケースにテスト結果を追加します",
		addResultsForCasesSchema,
		async ({ runId, results }) => {
			try {
				// Prepare data to send to the API
				const data = {
					results: results.map((result) => {
						const resultData: Record<string, unknown> = {
							case_id: result.caseId,
						};

						// Add status ID if specified
						if (result.statusId) {
							resultData.status_id = result.statusId;
						}

						// Add comment if specified
						if (result.comment) {
							resultData.comment = result.comment;
						}

						// Add version if specified
						if (result.version) {
							resultData.version = result.version;
						}

						// Add elapsed time if specified
						if (result.elapsed) {
							resultData.elapsed = result.elapsed;
						}

						// Add defects if specified
						if (result.defects) {
							resultData.defects = result.defects;
						}

						// Add assignee ID if specified
						if (result.assignedtoId) {
							resultData.assignedto_id = result.assignedtoId;
						}

						// Add additional custom fields from customFields object
						if (result.customFields) {
							for (const [key, value] of Object.entries(result.customFields)) {
								resultData[key] = value;
							}
						}

						return resultData;
					}),
				};

				const addedResults = await testRailClient.results.addResultsForCases(
					runId,
					data,
				);
				const successResponse = createSuccessResponse(
					"Results added successfully",
					{
						results: addedResults,
					},
				);
				return {
					content: [{ type: "text", text: JSON.stringify(successResponse) }],
				};
			} catch (error) {
				const errorResponse = createErrorResponse(
					`Error adding results for run ${runId}`,
					error,
				);
				return {
					content: [{ type: "text", text: JSON.stringify(errorResponse) }],
					isError: true,
				};
			}
		},
	);
}
