'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getStudentDetail } from '@/lib/api/admin';
import { StudentDetail } from '@/components/admin/StudentDetail';
import { ApiError } from '@/lib/api/auth';
import type { StudentDetail as StudentDetailType } from '@/types/admin';

type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = use(params);

  const [student, setStudent] = useState<StudentDetailType | null>(null);
  const [error, setError] = useState<{ status: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentDetail(studentId);
      setStudent(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ status: err.status });
      } else {
        setError({ status: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  if (loading) {
    return <SkeletonLayout />;
  }

  if (error) {
    if (error.status === 404) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-10 text-center">
          <p className="text-sm font-semibold text-muted">Student not found</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink border border-ink rounded px-3 py-1.5 hover:bg-bg-2 transition-colors"
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            Back to Class
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-10 text-center">
        <p className="text-sm font-semibold text-muted">Something went wrong</p>
        <button
          onClick={fetchStudent}
          className="text-xs font-semibold text-ink border border-ink rounded px-3 py-1.5 hover:bg-bg-2 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!student) return null;

  return <StudentDetail student={student} />;
}

function SkeletonLayout() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Top bar skeleton */}
      <div className="bg-card border-b border-border-2 px-5 py-2.5 flex items-center gap-3 shrink-0">
        <div className="h-7 w-28 bg-bg-3 rounded" />
        <div className="h-5 w-40 bg-bg-3 rounded ml-2" />
        <div className="h-6 w-24 bg-bg-3 rounded" />
        <div className="ml-auto h-7 w-36 bg-bg-3 rounded" />
      </div>

      {/* Two-column body skeleton */}
      <div className="flex-1 p-5 bg-bg-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div>
            <div className="h-4 w-28 bg-bg-3 rounded mb-3" />
            <div className="bg-card border border-border-2 rounded-lg overflow-hidden">
              <div className="h-8 bg-bg-2 border-b border-border-2" />
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-3 border-b border-border last:border-0"
                >
                  <div className="h-3 w-28 bg-bg-3 rounded" />
                  <div className="h-3 w-20 bg-bg-3 rounded" />
                  <div className="h-3 w-16 bg-bg-3 rounded" />
                  <div className="h-3 w-8 bg-bg-3 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="h-4 w-32 bg-bg-3 rounded mb-1" />
            <div className="h-3 w-24 bg-bg-3 rounded mb-3" />
            <div className="h-4 w-28 bg-bg-3 rounded mb-2" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border-2 rounded-lg px-3 py-3 mb-2"
              >
                <div className="h-3 w-3/4 bg-bg-3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
