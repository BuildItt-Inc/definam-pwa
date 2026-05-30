type TopicPageProps = {
  params: {
    topicId: string;
  };
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{
    topicId: string;
  }>;
}) {
  const { topicId } = await params;
  return <main>Learning flow scaffold for topic {topicId}</main>;
}
