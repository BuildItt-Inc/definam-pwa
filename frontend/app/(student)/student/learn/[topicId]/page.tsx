type TopicPageProps = {
  params: Promise<{
    topicId: string;
  }>;
};
export default async function TopicPage({ params }: TopicPageProps) {
  const { topicId } = await params;
  return <main>Learning flow scaffold for topic {topicId}</main>;
}

