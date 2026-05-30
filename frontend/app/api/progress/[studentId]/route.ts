type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { studentId } = await context.params;
  return Response.json({
    message: "Progress route scaffold",
    studentId,
  });
}
