type TopicPageProps = {
  params: {
    topicId: string;
  };
};

export default function TopicPage({ params }: TopicPageProps) {
  return <main>Learning flow scaffold for topic {params.topicId}</main>;
}
