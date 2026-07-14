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
});
