import { getAuthHeaders } from '@/lib/api/auth';
import {
  getAdminSubjects,
  getSubjectDetail,
  regenerateSubjectCurriculum,
  deleteSubject,
} from '../admin';

jest.mock('@/lib/api/auth');

describe('Admin Subject API Services', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    (getAuthHeaders as jest.Mock).mockResolvedValue({
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getAdminSubjects', () => {
    it('calls GET /api/v1/admin/subjects', async () => {
      const mockSubjects = [
        {
          name: 'English Language',
          class_levels: ['SS1', 'SS2', 'SS3'],
          chapter_count: 12,
          topic_count: 48,
          syllabus_chunks: 5,
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSubjects,
      } as Response);

      const subjects = await getAdminSubjects();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/subjects'),
        expect.objectContaining({
          headers: expect.anything(),
        })
      );
      expect(subjects).toEqual(mockSubjects);
    });
  });

  describe('getSubjectDetail', () => {
    it('calls GET /api/v1/admin/subjects/:subjectName', async () => {
      const mockDetail = {
        name: 'Mathematics',
        class_levels: ['SS1', 'SS2'],
        chapters: [],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDetail,
      } as Response);

      const detail = await getSubjectDetail('Mathematics');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/subjects/Mathematics'),
        expect.objectContaining({
          headers: expect.anything(),
        })
      );
      expect(detail).toEqual(mockDetail);
    });
  });

  describe('regenerateSubjectCurriculum', () => {
    it('calls POST /api/v1/admin/curriculum/generate/:subjectName', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Curriculum structure for 'Mathematics' successfully generated and seeded.",
        }),
      } as Response);

      const res = await regenerateSubjectCurriculum('Mathematics');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/curriculum/generate/Mathematics'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(res.message).toContain('Mathematics');
    });
  });

  describe('deleteSubject', () => {
    it('calls DELETE /api/v1/admin/subjects/:subjectName', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Subject 'Biology' deleted successfully.",
          deleted_rows: 3,
        }),
      } as Response);

      const res = await deleteSubject('Biology');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/subjects/Biology'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(res.deleted_rows).toBe(3);
    });
  });
});
