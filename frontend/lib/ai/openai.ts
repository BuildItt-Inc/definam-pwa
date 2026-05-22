export function getOpenAIClient() {
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  };
}
