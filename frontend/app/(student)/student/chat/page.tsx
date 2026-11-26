'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  House,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ZikoraLogo } from '@/components/student/ZikoraLogo';
import { ChatMessageItem } from '@/components/student/ChatMessageItem';
import { useTopicChat } from '@/hooks/useTopicChat';
import { getCachedHomeData, getHomeData } from '@/lib/api/topics';
import { getMe } from '@/lib/api/auth';
import { getFollowUpSuggestions } from '@/lib/utils/chatFollowUps';
import { getStudentProfile } from '@/lib/utils/studentProfile';
import type { RecentTopic } from '@/types/topics';

const WORKSPACE_QUICK_PILLS = [
  {
    label: 'Explain simply',
    prompt: 'Break down a difficult concept for me in clear, simple steps.',
  },
  {
    label: 'Worked example',
    prompt: 'Walk me through a step-by-step worked example on this.',
  },
  {
    label: 'Quiz me',
    prompt: 'Quiz me one multiple-choice question at a time with options A, B, C, D and rate my answer.',
  },
  {
    label: 'Study plan',
    prompt: 'Build a focused 30-minute study plan for my subjects today.',
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ChatWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get('topicId') ?? undefined;
  const initialTopicTitle = searchParams.get('title') ?? undefined;

  const [activeTopicId, setActiveTopicId] = useState<string | undefined>(initialTopicId);
  const [activeTopicTitle, setActiveTopicTitle] = useState<string | undefined>(initialTopicTitle);

  // Desktop starts open, mobile starts collapsed (drawer)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [sidebarQuery, setSidebarQuery] = useState('');

  // Live student & topic context (never hardcoded)
  const [displayName, setDisplayName] = useState<string>(() => {
    const p = getStudentProfile();
    const cached = getCachedHomeData();
    return p?.name || cached?.student_name || '';
  });
  const [userSub, setUserSub] = useState<string>('');
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>(() => {
    return getCachedHomeData()?.recent_topics ?? [];
  });

  useEffect(() => {
    let active = true;
    const loadContext = async () => {
      const p = getStudentProfile();
      const [me, home] = await Promise.all([
        getMe().catch(() => null),
        getHomeData().catch(() => getCachedHomeData()),
      ]);
      if (!active) return;

      const apiName = me?.name && me.name !== 'Student' ? me.name : '';
      const homeName = home?.student_name && home.student_name !== 'Student' ? home.student_name : '';
      const finalName = apiName || homeName || p?.name || me?.username || '';
      setDisplayName(finalName);

      const roleLabel =
        me?.role === 'student_individual' ? 'Independent learner' : home?.school_name || '';
      setUserSub([p?.class_level, roleLabel].filter(Boolean).join(' · '));

      if (home?.recent_topics) {
        setRecentTopics(home.recent_topics);
        if (initialTopicId && !initialTopicTitle) {
          const match = home.recent_topics.find((t) => t.topic_id === initialTopicId);
          if (match) setActiveTopicTitle(match.topic_title);
        }
      }
    };

    void loadContext();
    return () => {
      active = false;
    };
  }, [initialTopicId, initialTopicTitle]);

  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    confirmingClear,
    isClearing,
    quizScore,
    recordQuizOutcome,
    handleClearClick,
    submitMessage,
    handleSubmit,
    scrollContainerRef,
    messagesEndRef,
    showJumpToBottom,
    handleScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    jumpToBottom,
    followIfPinned,
  } = useTopicChat({ topicId: activeTopicId });

  const filteredTopics = sidebarQuery.trim()
    ? recentTopics.filter(
        (t) =>
          t.topic_title.toLowerCase().includes(sidebarQuery.toLowerCase()) ||
          t.subject.toLowerCase().includes(sidebarQuery.toLowerCase()),
      )
    : recentTopics;

  const followUpSuggestions =
    !isLoading && messages.length > 0
      ? getFollowUpSuggestions(messages, activeTopicTitle || 'this topic')
      : [];

  const selectThread = (topic?: RecentTopic) => {
    setActiveTopicId(topic?.topic_id);
    setActiveTopicTitle(topic?.topic_title);
    setMobileDrawerOpen(false);
    if (topic) {
      router.replace(`/student/chat?topicId=${encodeURIComponent(topic.topic_id)}&title=${encodeURIComponent(topic.topic_title)}`);
    } else {
      router.replace('/student/chat');
    }
  };

  const handleNewChat = () => {
    if (activeTopicId) {
      selectThread(undefined);
    } else if (messages.length > 0) {
      handleClearClick();
    }
  };

  const initial = displayName ? displayName[0].toUpperCase() : '';
  const greeting = getGreeting();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card">
      {/* Sidebar brand header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Link href="/student/chat" className="inline-flex items-center gap-2.5">
          <ZikoraLogo size={22} className="text-ink" />
          <span className="text-[16px] font-bold text-ink tracking-tight">Zikora</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false);
            setMobileDrawerOpen(false);
          }}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg-2 hover:text-ink transition-colors"
        >
          <PanelLeftClose size={17} strokeWidth={1.8} />
        </button>
      </div>

      {/* Sidebar search */}
      <div className="px-3 pb-3">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-bg-0 px-3 py-2 focus-within:border-ink/35 transition-colors">
          <Search size={14} strokeWidth={1.9} className="text-muted flex-shrink-0" />
          <input
            type="search"
            value={sidebarQuery}
            onChange={(e) => setSidebarQuery(e.target.value)}
            placeholder="Search study threads"
            className="w-full min-w-0 bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
          />
        </label>
      </div>

      {/* Primary Recall workspace links */}
      <nav className="px-3 space-y-0.5 pb-3 border-b border-border/80" aria-label="Workspace navigation">
        <Link
          href="/student"
          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-muted hover:bg-bg-2 hover:text-ink transition-colors"
        >
          <House size={15} strokeWidth={1.8} />
          <span>Home</span>
        </Link>
        <Link
          href="/student/learn"
          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-muted hover:bg-bg-2 hover:text-ink transition-colors"
        >
          <BookOpen size={15} strokeWidth={1.8} />
          <span>Subjects</span>
        </Link>
        <Link
          href="/student/review"
          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-muted hover:bg-bg-2 hover:text-ink transition-colors"
        >
          <RefreshCw size={15} strokeWidth={1.8} />
          <span>Review</span>
        </Link>
      </nav>

      {/* Live conversation & topic threads */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <p className="px-2.5 mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-faint">
            Active chat
          </p>
          <button
            type="button"
            onClick={() => selectThread(undefined)}
            className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors ${
              !activeTopicId
                ? 'bg-brand-tint text-brand'
                : 'text-muted hover:bg-bg-2 hover:text-ink'
            }`}
          >
            <Sparkles size={14} strokeWidth={2} className="flex-shrink-0" />
            <span className="truncate">General study tutor</span>
          </button>
        </div>

        <div>
          <p className="px-2.5 mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-faint">
            Topic threads
          </p>
          {filteredTopics.length > 0 ? (
            <div className="space-y-0.5">
              {filteredTopics.map((topic) => {
                const isSelected = activeTopicId === topic.topic_id;
                return (
                  <button
                    key={topic.topic_id}
                    type="button"
                    onClick={() => selectThread(topic)}
                    className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-brand-tint font-semibold text-brand'
                        : 'text-muted hover:bg-bg-2 hover:text-ink font-medium'
                    }`}
                  >
                    <MessageSquare size={14} strokeWidth={1.75} className="flex-shrink-0 opacity-75" />
                    <span className="min-w-0 flex-1 truncate">{topic.topic_title}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2.5 text-[12px] text-faint leading-relaxed">
              {recentTopics.length === 0
                ? 'Open any subject topic to start a topic-specific chat thread.'
                : 'No matching topic threads.'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom student card */}
      <div className="border-t border-border px-4 py-3.5">
        <Link
          href="/student/settings"
          className="flex items-center gap-2.5 rounded-xl p-1 -m-1 hover:bg-bg-0 transition-colors"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-on-ink text-[13px] font-bold select-none">
            {initial || '·'}
          </div>
          <div className="min-w-0 flex-1">
            {displayName ? (
              <>
                <p className="truncate text-[13px] font-bold text-ink leading-tight">{displayName}</p>
                {userSub && (
                  <p className="truncate text-[11px] text-faint leading-tight mt-0.5">{userSub}</p>
                )}
              </>
            ) : (
              <p className="text-[12px] text-muted">Account settings</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-0">
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden md:block flex-shrink-0 border-r border-border bg-card transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarOpen ? 'w-[256px]' : 'w-0 border-r-0'
        }`}
      >
        <div className="h-full w-[256px]">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden bg-black/45 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileDrawerOpen(false);
          }}
        >
          <div className="h-full w-[272px] max-w-[82vw] border-r border-border bg-card shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main chat canvas */}
      <div className="flex flex-1 min-w-0 flex-col bg-bg-0 relative">
        {/* Top bar */}
        <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 border-b border-border bg-bg-0/90 backdrop-blur-sm px-4 md:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop toggle when collapsed, or mobile drawer button */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                title="Open sidebar"
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-ink hover:bg-bg-2 transition-colors"
              >
                <PanelLeftOpen size={16} strokeWidth={1.8} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-ink"
            >
              <PanelLeftOpen size={16} strokeWidth={1.8} />
            </button>

            {/* Active context pill */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 min-w-0 shadow-2xs">
              <ZikoraLogo size={17} className="text-ink flex-shrink-0" />
              <span className="truncate text-[13px] font-semibold text-ink">
                {activeTopicTitle || 'Zikora'}
              </span>
              {quizScore.total > 0 && (
                <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10.5px] font-bold text-brand">
                  {quizScore.correct}/{quizScore.total}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {messages.length > 0 && confirmingClear ? (
              <button
                type="button"
                onClick={handleClearClick}
                disabled={isClearing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-danger-bg px-3.5 py-2 text-[12.5px] font-bold text-danger hover:bg-danger/15 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={2} />
                <span>Confirm clear?</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-on-ink hover:opacity-90 active:scale-[0.98] transition-all shadow-2xs"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>New chat</span>
              </button>
            )}

            <Link
              href="/student/settings"
              aria-label="Account settings"
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-[12px] font-bold text-ink hover:bg-bg-2 transition-colors"
            >
              {initial || '·'}
            </Link>
          </div>
        </header>

        {/* Conversation body OR centered empty workspace */}
        {messages.length === 0 ? (
          <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 pb-10 overflow-y-auto">
            <div className="w-full max-w-2xl flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <ZikoraLogo size={32} className="text-ink" />
              </div>

              <h1 className="text-[26px] sm:text-[32px] font-bold text-ink tracking-tight leading-tight">
                {greeting}
                {displayName ? `, ${displayName}` : ''}
              </h1>
              <p className="mt-1 text-[20px] sm:text-[26px] font-bold tracking-tight leading-snug text-ink">
                How can Zikora{' '}
                <span className="text-brand">help you study today?</span>
              </p>

              {activeTopicTitle && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-[12px] font-semibold text-brand">
                  <BookOpen size={13} strokeWidth={2} />
                  <span>Focused on: {activeTopicTitle}</span>
                </p>
              )}

              {/* Centered composer card matching clean BeeBot / Gemini aesthetic */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 w-full rounded-2xl border border-border-2 bg-card p-3.5 shadow-sm focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/5 transition-all text-left"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  placeholder={
                    activeTopicTitle
                      ? `Ask Zikora about ${activeTopicTitle}…`
                      : 'Ask Zikora anything about your subjects…'
                  }
                  className="w-full bg-transparent px-1.5 py-2 text-[15px] text-ink placeholder:text-faint focus:outline-none disabled:opacity-50"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {WORKSPACE_QUICK_PILLS.map((pill) => (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => void submitMessage(pill.prompt)}
                        className="rounded-lg border border-border bg-bg-0 px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink active:scale-[0.98] transition-all"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    aria-label="Send message"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-on-ink hover:opacity-90 disabled:bg-bg-2 disabled:text-faint transition-all active:scale-95"
                  >
                    <ArrowUp size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </form>
            </div>
          </main>
        ) : (
          <>
            <main
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y py-6"
            >
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 sm:px-6">
                {messages.map((msg, index) => {
                  const isLast = index === messages.length - 1;
                  const isLastAssistant = isLast && msg.role === 'assistant';
                  return (
                    <div key={index} className="space-y-3">
                      <ChatMessageItem
                        message={msg}
                        isStreaming={isLastAssistant && isLoading}
                        interactiveDisabled={isLoading || !isLast}
                        onStreamAdvance={followIfPinned}
                        onSelectOption={(reply) => void submitMessage(reply)}
                        onScored={recordQuizOutcome}
                      />

                      {isLast &&
                        msg.role === 'assistant' &&
                        !isLoading &&
                        followUpSuggestions.length > 0 && (
                          <div className="flex flex-wrap items-start gap-2 pt-1">
                            {followUpSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => void submitMessage(suggestion)}
                                className="rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-ink shadow-2xs hover:bg-bg-2 active:scale-[0.98] transition-all text-left"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </main>

            {showJumpToBottom && (
              <button
                type="button"
                onClick={jumpToBottom}
                aria-label="Jump to bottom"
                className="absolute bottom-[94px] left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-ink shadow-md hover:bg-bg-2 active:scale-95 transition-all"
              >
                <ArrowDown size={16} strokeWidth={2.2} />
              </button>
            )}

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-border bg-bg-0/95 backdrop-blur-sm px-4 sm:px-6 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)]"
            >
              <div className="mx-auto flex max-w-3xl items-center gap-2.5 rounded-2xl border border-border-2 bg-card px-4 py-2.5 min-h-[48px] shadow-2xs focus-within:border-ink/40 focus-within:ring-2 focus-within:ring-ink/5 transition-all">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  placeholder="Reply to Zikora"
                  className="flex-1 min-w-0 bg-transparent text-[15px] leading-normal placeholder:text-faint focus:outline-none text-ink disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  aria-label="Send message"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-on-ink hover:opacity-90 disabled:bg-bg-2 disabled:text-faint transition-all active:scale-95"
                >
                  <ArrowUp size={15} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspaceInner />
    </Suspense>
  );
}
