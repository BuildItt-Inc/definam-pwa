type RouteContext = {
  params: Promise<{
    topicId: string;
    step: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  return Response.json({
    message: "Learn route scaffold",
    params,
  });
}
