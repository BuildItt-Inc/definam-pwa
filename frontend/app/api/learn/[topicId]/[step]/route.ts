type RouteContext = {
  params: {
    topicId: string;
    step: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  return Response.json({
    message: "Learn route scaffold",
    params: context.params,
  });
}
