type StudentDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};
export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  return <main>Student drill-down scaffold for {studentId}</main>;
}
