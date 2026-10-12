import logging

from openai import AsyncAzureOpenAI, AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_client():
    endpoint = (
        settings.azure_openai_endpoint.strip() if settings.azure_openai_endpoint else ""
    )
    key = settings.azure_openai_api_key.strip() if settings.azure_openai_api_key else ""
    if not endpoint or not key:
        return None

    if "services.ai.azure.com" in endpoint:
        base_url = endpoint.rstrip("/")
        for suffix in ("/responses", "/chat/completions"):
            if base_url.endswith(suffix):
                base_url = base_url[: -len(suffix)]
        if not base_url.endswith("/openai/v1"):
            if not base_url.endswith("/openai"):
                base_url = f"{base_url}/openai/v1"
            else:
                base_url = f"{base_url}/v1"
        return AsyncOpenAI(base_url=base_url, api_key=key)

    return AsyncAzureOpenAI(
        api_key=key,
        azure_endpoint=endpoint,
        api_version=settings.azure_openai_api_version,
    )


client = _get_client()
_MODEL = settings.azure_openai_deployment
_FALLBACK_MODEL = settings.azure_openai_fallback_deployment


async def stream_claude_response(
    user_question: str, topic_context: str, history: list[dict]
):
    """
    Stream an AI response via Azure OpenAI (with fallback). Yields:
        - ("chunk", text) for each content chunk
        - ("usage", {"input_tokens": n, "output_tokens": m}) after the stream ends
    """
    context_instruction = (
        f"Stay strictly within the provided topic context.\n\nTopic context:\n{topic_context}"
        if topic_context
        else (
            "The student opened this chat generally. "
            "You MUST ONLY answer academic questions that fall strictly within the secondary school curriculum "
            "(SSCE, WASSCE, NECO, JAMB, UTME, O-Level, A-Level high school subjects such as Mathematics, "
            "Physics, Chemistry, Biology, English Language & Literature, Economics, Government, Commerce, "
            "Financial Accounting, Agricultural Science, Geography, Computer Studies/ICT, History, Civic Education, CRK/IRS)."
        )
    )
    system_prompt = (
        "You are an AI academic Socratic tutor for Recall, dedicated EXCLUSIVELY to secondary school education.\n\n"
        "STRICT BOUNDARIES AND GUARDRAILS:\n"
        "1. EXCLUSIVELY SECONDARY SCHOOL CURRICULUM: You must only assist with academic topics covered in "
        "secondary school curricula (e.g. WASSCE, SSCE, NECO, JAMB, UTME, O-Level, A-Level).\n"
        "2. REFUSE NON-SCHOOL AND UNRELATED TOPICS: If the user asks non-academic or non-school-related questions "
        "(e.g., pop culture, video games, casual advice, gossip, coding outside secondary school ICT, general trivia), "
        "politely refuse to answer. State clearly and warmly that you are an academic tutor focused exclusively on secondary school subjects.\n"
        "3. REFUSE UNIVERSITY AND POST-GRADUATE TOPICS: If the user asks questions beyond secondary school level "
        "(e.g. university-level higher mathematics/advanced calculus, post-graduate quantum physics, tertiary law or medicine, advanced research topics), "
        "politely decline by explaining that the topic exceeds secondary school scope, and offer to help with secondary school level questions instead.\n\n"
        "SOCRATIC TUTORING STYLE:\n"
        "Your default style is Socratic: guide the student to discover the answer "
        "themselves with hints, guiding questions, and clear secondary-level explanations.\n\n"
        "Give a direct, clear answer immediately instead (no guiding question) ONLY in these cases:\n"
        "1. The student explicitly asks for the answer directly (e.g. 'just tell me', 'what is the answer', 'explain directly').\n"
        "2. The question is basic arithmetic or a simple secondary-level definition/fact lookup (e.g. 'what is 2+2', 'define photosynthesis').\n"
        "3. The conversation history below already contains this same question from the student.\n\n"
        f"{context_instruction}\n\n"
        "Vary your greetings. Use warm, encouraging openings like: "
        "'Let's explore this together,' 'That's a great question,' "
        "'Let me help you understand this,' or 'Let me break this down.' "
        "Keep responses friendly, academically accurate, clear, and appropriately leveled for high school / secondary students."
    )

    # Build messages: system prompt first, then clean history, then the new user question
    clean_history = [m for m in history if m.get("role") != "system"]
    messages = [
        {"role": "system", "content": system_prompt},
        *clean_history,
        {"role": "user", "content": user_question},
    ]

    input_tokens = output_tokens = 0

    if not client:
        yield (
            "chunk",
            "Error: Azure OpenAI is not configured. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.",
        )
        yield ("usage", {"input_tokens": 0, "output_tokens": 0})
        return

    models_to_try = [_MODEL]
    if _FALLBACK_MODEL and _FALLBACK_MODEL != _MODEL:
        models_to_try.append(_FALLBACK_MODEL)

    streamed_any = False
    for attempt_idx, model_name in enumerate(models_to_try):
        try:
            stream = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_completion_tokens=1024,
                stream=True,
                stream_options={"include_usage": True},
            )
            try:
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        streamed_any = True
                        yield ("chunk", chunk.choices[0].delta.content)
                    if chunk.usage:
                        input_tokens = chunk.usage.prompt_tokens
                        output_tokens = chunk.usage.completion_tokens
            finally:
                await stream.close()
            break
        except Exception as e:
            logger.error(f"Streaming error with model {model_name}: {e}")
            if streamed_any:
                yield ("chunk", f"\n\n[Response interrupted: {e}]")
                break
            if attempt_idx < len(models_to_try) - 1:
                logger.info(f"Falling back to model: {models_to_try[attempt_idx + 1]}")
                continue
            yield ("chunk", f"Error: Failed to connect to AI service ({e}).")

    yield ("usage", {"input_tokens": input_tokens, "output_tokens": output_tokens})
