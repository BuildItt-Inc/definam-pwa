from groq import AsyncGroq

from app.core.config import get_settings

settings = get_settings()
client = AsyncGroq(api_key=settings.groq_api_key)

async def stream_groq_response(
    user_question: str,
    topic_context: str,
    history: list[dict]
):
    """
    Stream Groq's response. Yields:
        - ("chunk", text) for each content chunk
        - ("usage", {"input_tokens": n, "output_tokens": m}) after the stream ends
    """
    system_prompt = (
        "You are a Socratic Nigerian tutor for DefinAm. "
        "Never give the answer directly. Guide the student to discover it themselves. "
        "Use Nigerian examples where relevant. "
        "Stay strictly within the provided topic context.\n\n"
        "Vary your greetings. Use warm, encouraging openings like: "
        "'Let's explore this together,' 'That's a great question,' "
        "'I like your curiosity,' or 'Let's break this down.' "
        "Avoid starting every response with 'My inquisitive student.'\n\n"
        f"Topic context:\n{topic_context}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": user_question}
    ]

    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=1024,
        stream=True,
    )

    usage = None
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield ("chunk", chunk.choices[0].delta.content)
        if hasattr(chunk, 'usage') and chunk.usage:
            usage = chunk.usage

    if usage:
        yield ("usage", {
            "input_tokens": usage.prompt_tokens,
            "output_tokens": usage.completion_tokens
        })
    else:
        # Fallback (should not happen with Groq)
        yield ("usage", {"input_tokens": 0, "output_tokens": 0})