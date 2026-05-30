type StudentDetailPageProps = {
  params: {
    studentId: string;
  };
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{
    studentId: string;
  }>;
}) {
  const { studentId } = await params;
  return <main>Student drill-down scaffold for {studentId}</main>;
}
