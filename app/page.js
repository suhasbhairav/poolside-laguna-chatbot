"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I am Suhas Bhairav Poolside Laguna Chat. Ask me anything and I will stream the answer here.",
  },
];

const SUGGESTIONS = [
  "How many r's are in the word strawberry?",
  "Explain how to design a reliable coding agent",
  "Draft a clean technical product launch checklist",
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  async function sendMessage(messageText = input) {
    const trimmed = messageText.trim();

    if (!trimmed || isStreaming) return;

    const userMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    const assistantId = createId();
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.content.trim())
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const details = await response.text();
        throw new Error(details || "The chat request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        );
      }
    } catch (requestError) {
      if (requestError.name === "AbortError") return;

      setError(requestError.message);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantId && !message.content
            ? {
                ...message,
                content:
                  "I could not complete that request. Check your OpenRouter API key and try again.",
              }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#eef3ef] text-[#141716]">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-3 py-3 sm:px-5 lg:px-8">
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-t-[28px] border border-[#d7dfd7] bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#12332c] text-sm font-semibold text-white shadow-sm">
              PL
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">
                Suhas Bhairav Poolside Laguna Chat
              </h1>
              <p className="truncate text-xs text-[#65716c] sm:text-sm">
                Streaming answers through poolside/laguna-m.1:free
              </p>
            </div>
          </div>
          <a
            className="hidden rounded-full border border-[#cad8ce] px-4 py-2 text-sm font-medium text-[#26332f] transition hover:border-[#12332c] hover:bg-[#f5f8f5] sm:inline-flex"
            href="https://openrouter.ai/poolside/laguna-m.1:free"
            target="_blank"
            rel="noreferrer"
          >
            Model
          </a>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden border-x border-[#d7dfd7] bg-[#fbfcfa]">
          <div
            ref={scrollRef}
            className="chat-scroll min-h-0 flex-1 overflow-y-scroll px-3 py-4 sm:px-6 sm:py-7"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[#12332c] text-xs font-semibold text-white">
                      AI
                    </div>
                  )}
                  <div
                    className={`message-bubble ${
                      message.role === "user"
                        ? "bg-[#12332c] text-white"
                        : "border border-[#e0e7e1] bg-white text-[#1d2421] shadow-sm"
                    }`}
                  >
                    {message.content ? (
                      <p className="whitespace-pre-wrap leading-7">
                        {message.content}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-[#6d7974]">
                        <span className="typing-dot" />
                        <span className="typing-dot animation-delay-150" />
                        <span className="typing-dot animation-delay-300" />
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#e0e7e1] bg-white/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-5">
            <div className="mx-auto w-full max-w-3xl">
              {error && (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {messages.length === 1 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="shrink-0 rounded-full border border-[#d8e1d9] bg-[#fbfcfa] px-4 py-2 text-left text-sm text-[#394641] transition hover:border-[#12332c] hover:bg-white"
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="flex items-end gap-2 rounded-[24px] border border-[#d5dfd7] bg-[#fbfcfa] p-2 shadow-sm focus-within:border-[#12332c]"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <textarea
                  ref={textareaRef}
                  className="min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-base leading-6 text-[#151a18] outline-none placeholder:text-[#7f8b85]"
                  placeholder="Message Poolside Laguna..."
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[#dce8df] text-[#12332c] transition hover:bg-[#cedfd3]"
                    aria-label="Stop response"
                    onClick={stopStreaming}
                  >
                    <span className="size-3 rounded-sm bg-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[#12332c] text-white transition hover:bg-[#245349] disabled:cursor-not-allowed disabled:bg-[#bdc9c1]"
                    aria-label="Send message"
                    disabled={!input.trim()}
                  >
                    <span className="-mt-0.5 text-xl leading-none">↑</span>
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>

        <footer className="shrink-0 rounded-b-[28px] border border-[#d7dfd7] bg-white/90 px-4 py-3 text-center text-xs text-[#68746f] sm:text-sm">
          Created by{" "}
          <a
            className="font-medium text-[#141716] underline-offset-4 hover:underline"
            href="https://suhasbhairav.com"
            target="_blank"
            rel="noreferrer"
          >
            Suhas Bhairav
          </a>
        </footer>
      </div>
    </main>
  );
}
