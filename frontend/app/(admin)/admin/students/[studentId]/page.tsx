type StudentDetailPageProps = {
  params: {
    studentId: string;
  };
};

export default function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  return <main>Student drill-down scaffold for {params.studentId}</main>;
}
