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
            "The student opened this chat generally, not from a specific topic — "
            "there is no topic context. Answer broadly based on the secondary "
            "school curriculum and general study help."
        )
    )
    system_prompt = (
        "You are a Socratic AI tutor for Recall. "
        "Your default style is Socratic: guide the student to discover the answer "
        "themselves with questions, hints, and real-world examples, rather than "
        "stating it outright.\n\n"
        "Give a direct, clear answer immediately instead — no guiding question, "
        "no withholding — in any of these cases:\n"
        "1. The student explicitly asks for the answer directly (e.g. 'just tell "
        "me', 'what is the answer', 'I don't understand, please explain').\n"
        "2. The question is basic arithmetic or a simple factual/definitional "
        "lookup that doesn't benefit from guided exploration (e.g. 'what is 2+2', "
        "'what is 4 x 4', 'what does [term] mean').\n"
        "3. The conversation history below already contains this same question, "
        "or a close paraphrase of it, from the student. Do not invent another new "
        "analogy or ask another guiding question — answer it directly first. You "
        "may briefly offer to explore further afterward if the student wants.\n\n"
        f"{context_instruction}\n\n"
        "Vary your greetings. Use warm, encouraging openings like: "
        "'Let's explore this together,' 'That's a great question,' "
        "'I like your curiosity,' or 'Let's break this down.' "
        "Avoid starting every response with 'My inquisitive student.'"
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
