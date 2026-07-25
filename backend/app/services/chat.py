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
    context_instruction = (
        f"Stay strictly within the provided topic context.\n\nTopic context:\n{topic_context}"
        if topic_context
        else (
            "The student opened this chat generally, not from a specific topic — "
            "there is no topic context. Answer broadly based on the WAEC/Nigerian "
            "secondary school curriculum and general study help."
        )
    )
    system_prompt = (
        "You are a Socratic Nigerian tutor for Recall. "
        "Your default style is Socratic: guide the student to discover the answer "
        "themselves with questions, hints, and Nigerian examples, rather than "
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