import { describe, expect, it, vi, beforeEach } from "vitest";
import { PlansClient } from "../../../src/client/api/plans.js";
import { TestRailPlan, TestRailPlanEntry } from "../../../src/shared/schemas/plans.js";
import { TestRailRun } from "../../../src/shared/schemas/runs.js";
import { TestRailClientConfig, BaseTestRailClient } from "../../../src/client/api/baseClient.js";
import { AxiosInstance } from "axios";

describe("PlansClient", () => {
	const mockAxios = {
		get: vi.fn(),
		post: vi.fn(),
	};

	const mockConfig: TestRailClientConfig = {
		baseURL: "http://example.com",
		auth: {
			username: "test",
			password: "test",
		},
	};

	const client = new PlansClient(mockConfig);

	beforeEach(() => {
		const axiosInstance = (client as BaseTestRailClient)["client"] as AxiosInstance;
		vi.spyOn(axiosInstance, "get").mockImplementation(mockAxios.get);
		vi.spyOn(axiosInstance, "post").mockImplementation(mockAxios.post);
	});

	it("should get all test plans for a project", async () => {
		const mockPlans: TestRailPlan[] = [
			{
				id: 1,
				name: "Test Plan 1",
				description: "Description 1",
				project_id: 1,
				entries: [],
				created_on: 1234567890,
				created_by: 1,
				is_completed: false,
				completed_on: null,
				passed_count: 0,
				blocked_count: 0,
				untested_count: 0,
				retest_count: 0,
				failed_count: 0,
				url: "http://example.com",
			},
		];

		mockAxios.get.mockResolvedValueOnce({ data: mockPlans });

		const result = await client.getPlans(1);

		expect(mockAxios.get).toHaveBeenCalledWith("/api/v2/get_plans/1", {
			params: undefined,
		});
		expect(result).toEqual(mockPlans);
	});

	it("should handle errors when getting test plans", async () => {
		const errorMessage = "API Error";
		mockAxios.get.mockRejectedValueOnce(new Error(errorMessage));

		await expect(client.getPlans(1)).rejects.toThrow(errorMessage);
	});

	it("should get a specific test plan by id, including entries and runs", async () => {
		const mockPlan: TestRailPlan = {
			id: 1282,
			name: "20.2 Manual Regression Test Plan/Test Runs",
			project_id: 1,
			created_on: 1234567890,
			created_by: 1,
			is_completed: false,
			completed_on: null,
			passed_count: 41,
			blocked_count: 0,
			untested_count: 51,
			retest_count: 0,
			failed_count: 0,
			url: "http://example.com/plans/view/1282",
			entries: [
				{
					id: "entry-1",
					suite_id: 1,
					name: "Regression Suite",
					include_all: true,
					runs: [
						{
							id: 1357,
							suite_id: 1,
							name: "Test Run 6/25/2026",
							description: "",
							milestone_id: 31,
							assignedto_id: 6,
							include_all: false,
							is_completed: true,
							completed_on: 1782755740,
							config: null,
							config_ids: [],
							passed_count: 1,
							blocked_count: 0,
							untested_count: 0,
							retest_count: 0,
							failed_count: 0,
							custom_status_count: {},
							created_on: 1782419392,
							created_by: 6,
							plan_id: 1282,
							url: "http://example.com/runs/view/1357",
							refs: "OC-27924",
						},
					],
				},
			],
		};

		mockAxios.get.mockResolvedValueOnce({ data: mockPlan });

		const result = await client.getPlan(1282);

		expect(mockAxios.get).toHaveBeenCalledWith("/api/v2/get_plan/1282");
		expect(result).toEqual(mockPlan);
	});

	it("should handle errors when getting a test plan", async () => {
		const errorMessage = "API Error";
		mockAxios.get.mockRejectedValueOnce(new Error(errorMessage));

		await expect(client.getPlan(1282)).rejects.toThrow(errorMessage);
	});

	it("should create a new test plan with name only", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addPlan(2, {
			name: "Test Plan",
		});

		expect(mockAxios.post).toHaveBeenCalledWith("/api/v2/add_plan/2", {
			name: "Test Plan",
		});
	});

	it("should create a test plan with all optional fields", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addPlan(2, {
			name: "Plan with Entries",
			description: "Test plan with test runs",
			milestoneId: 1,
			entries: [
				{
					suite_id: 6,
					name: "Test Run 1",
					include_all: true,
				},
			],
		});

		expect(mockAxios.post).toHaveBeenCalledWith("/api/v2/add_plan/2", {
			name: "Plan with Entries",
			description: "Test plan with test runs",
			milestone_id: 1,
			entries: [
				{
					suite_id: 6,
					name: "Test Run 1",
					include_all: true,
				},
			],
		});
	});

	it("should add a plan entry with minimal parameters", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addPlanEntry(15, {
			suiteId: 6,
		});

		expect(mockAxios.post).toHaveBeenCalledWith("/api/v2/add_plan_entry/15", {
			suite_id: 6,
		});
	});

	it("should add a plan entry with all optional parameters", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addPlanEntry(15, {
			suiteId: 6,
			name: "Specific Cases Run",
			description: "Test specific cases",
			assignedtoId: 2,
			includeAll: false,
			caseIds: [1, 2, 3],
			configIds: [1, 2],
			refs: "REQ-123",
		});

		expect(mockAxios.post).toHaveBeenCalledWith("/api/v2/add_plan_entry/15", {
			suite_id: 6,
			name: "Specific Cases Run",
			description: "Test specific cases",
			assignedto_id: 2,
			include_all: false,
			case_ids: [1, 2, 3],
			config_ids: [1, 2],
			refs: "REQ-123",
		});
	});

	it("should add a run to plan entry with minimal parameters", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addRunToPlanEntry(15, "entry-id", {
			configIds: [1],
		});

		expect(mockAxios.post).toHaveBeenCalledWith(
			"/api/v2/add_run_to_plan_entry/15/entry-id",
			{
				config_ids: [1],
			},
		);
	});

	it("should add a run to plan entry with all optional parameters", async () => {
		mockAxios.post.mockResolvedValueOnce({ data: {} });

		await client.addRunToPlanEntry(15, "entry-id", {
			configIds: [1],
			description: "Test specific cases",
			assignedtoId: 2,
			includeAll: false,
			caseIds: [1, 2, 3],
			refs: "REQ-123",
		});

		expect(mockAxios.post).toHaveBeenCalledWith(
			"/api/v2/add_run_to_plan_entry/15/entry-id",
			{
				config_ids: [1],
				description: "Test specific cases",
				assignedto_id: 2,
				include_all: false,
				case_ids: [1, 2, 3],
				refs: "REQ-123",
			},
		);
	});
});
