type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  return Response.json({
    message: "Progress route scaffold",
    studentId: params.studentId,
  });
}
