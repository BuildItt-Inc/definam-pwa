type RouteContext = {
  params: {
    studentId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  return Response.json({
    message: "Progress route scaffold",
    studentId: context.params.studentId,
  });
}
