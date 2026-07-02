from groq import AsyncGroq

from app.core.config import get_settings

settings = get_settings()
client = AsyncGroq(api_key=settings.groq_api_key)

async def stream_groq_response(
    user_question: str,
    topic_context: str,
    history: list[dict]
):
    system_prompt = (
        "You are a Socratic Nigerian tutor for DefinAm. "
        "Never give the answer directly. Guide the student to discover it themselves. "
        "Use Nigerian examples where relevant. "
        "Stay strictly within the provided topic context.\n\n"
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

    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content