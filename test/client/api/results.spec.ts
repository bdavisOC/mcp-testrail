import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupMocks, createTestClient } from './testHelper';

describe('Results API', () => {
  let mockAxiosInstance: ReturnType<typeof setupMocks>;
  let client: ReturnType<typeof createTestClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosInstance = setupMocks();
    client = createTestClient();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deletes an attachment by numeric ID', async () => {
    // TestRail returns an empty body with a 200 on success
    mockAxiosInstance.post.mockResolvedValue({ data: '' });

    const result = await client.results.deleteAttachment(1000011824);

    // Verify axios post was called with the correct endpoint
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/api/v2/delete_attachment/1000011824',
    );

    // Method resolves void
    expect(result).toBeUndefined();
  });

  it('deletes an attachment by TestRail 7.1+ reference-string ID', async () => {
    mockAxiosInstance.post.mockResolvedValue({ data: '' });

    const refId = '2054f652-fe2f-4542-acb0-422910ed87e3';
    await client.results.deleteAttachment(refId);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      `/api/v2/delete_attachment/${refId}`,
    );
  });

  it('handles errors when deleting an attachment', async () => {
    // Mock error response (404 - attachment not found)
    const mockError = {
      response: {
        status: 404,
        data: { error: 'Attachment not found' },
      },
    };
    mockAxiosInstance.post.mockRejectedValue(mockError);

    await expect(client.results.deleteAttachment(999)).rejects.toThrow();

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/api/v2/delete_attachment/999',
    );
  });

  it('edits an existing result with a partial update', async () => {
    const updated = { id: 601202, status_id: 1, comment: 'Updated' };
    mockAxiosInstance.post.mockResolvedValue({ data: updated });

    const data = {
      comment: 'Updated',
      custom_step_results: [{ content: 'Step', expected: 'Exp', actual: 'Act', status_id: 1 }],
    };
    const result = await client.results.editResult(601202, data);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/api/v2/edit_result/601202',
      data,
    );
    expect(result).toEqual(updated);
  });

  it('handles errors when editing a result', async () => {
    mockAxiosInstance.post.mockRejectedValue({
      response: { status: 400, data: { error: 'Field :status_id is not a valid status' } },
    });

    await expect(client.results.editResult(1, { status_id: 3 })).rejects.toThrow();
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v2/edit_result/1', { status_id: 3 });
  });

  it('updates multiple results and returns updated and failed arrays', async () => {
    const response = {
      updated: [{ result_id: 101, success: true }],
      failed: [{ result_id: 102, error: 'Invalid status_id' }],
    };
    mockAxiosInstance.post.mockResolvedValue({ data: response });

    const data = {
      results: [
        { result_id: 101, status_id: 1, comment: 'Updated after retry' },
        { result_id: 102, status_id: 99 },
      ],
    };
    const result = await client.results.updateResults(data);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v2/update_results', data);
    expect(result).toEqual(response);
  });

  it('handles errors when updating multiple results', async () => {
    mockAxiosInstance.post.mockRejectedValue({
      response: { status: 400, data: { error: 'Missing results array' } },
    });

    await expect(client.results.updateResults({ results: [] })).rejects.toThrow();
  });
});
