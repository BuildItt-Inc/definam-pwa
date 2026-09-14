import logging

import anthropic

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
client = anthropic.AsyncAnthropic(
    api_key=settings.anthropic_api_key,
    base_url=settings.anthropic_base_url or None,
)

_MODEL = settings.anthropic_model

async def stream_claude_response(
    user_question: str, topic_context: str, history: list[dict]
):
    """
    Stream Claude's response. Yields:
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

    # Anthropic uses a separate `system` param; strip any system messages from history
    clean_history = [m for m in history if m.get("role") != "system"]
    messages = [
        *clean_history,
        {"role": "user", "content": user_question},
    ]

    input_tokens = output_tokens = 0

    try:
        async with client.messages.stream(
            model=_MODEL,
            system=system_prompt,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        ) as stream:
            async for text in stream.text_stream:
                yield ("chunk", text)

            # Final message contains token usage
            final = await stream.get_final_message()
            input_tokens = final.usage.input_tokens
            output_tokens = final.usage.output_tokens
    except anthropic.AuthenticationError as e:
        logger.error(f"Anthropic Authentication Error: {e}")
        yield (
            "chunk",
            "Error: Invalid API key. Please check your Claude API key configuration.",
        )
    except anthropic.AnthropicError as e:
        logger.error(f"Anthropic API Error: {e}")
        yield ("chunk", f"Error: Failed to connect to Claude AI ({e}).")
    except Exception as e:
        logger.error(f"Unexpected error in stream_claude_response: {e}")
        yield (
            "chunk",
            "Error: An unexpected error occurred while communicating with the AI.",
        )

    yield ("usage", {"input_tokens": input_tokens, "output_tokens": output_tokens})
