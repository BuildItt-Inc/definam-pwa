type RouteContext = {
  params: Promise<{
    topicId: string;
    step: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { topicId, step } = await context.params;
  return Response.json({
    message: "Learn route scaffold",
    params: { topicId, step },
  });
}
