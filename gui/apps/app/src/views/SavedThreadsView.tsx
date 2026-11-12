import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ThreadListEntry } from "@osmodeck/domain";
import { isThreadSavedForLater } from "@osmodeck/client-core";
import "@osmodeck/shared-ui/icon-extended";
import { Button } from "@osmodeck/shared-ui/button";
import { EmptyStatePanel } from "@osmodeck/shared-ui/empty-state";
import { Icon } from "@osmodeck/shared-ui/icon";
import { Input } from "@osmodeck/shared-ui/input";
import { Pill } from "@osmodeck/shared-ui/pill";
import { useRestoreSavedThread } from "@/hooks/mutations/thread-state-mutations";
import {
  useSidebarNavigation,
  useSidebarNavigationThreadSelection,
} from "@/hooks/queries/sidebar-navigation-query";
import { getThreadRoutePath } from "@/lib/route-paths";
import { formatRelativeTime } from "@/lib/relative-time";
import { getThreadDisplayTitle } from "@/lib/thread-title";

function selectSavedThreads(threads: ThreadListEntry[]): ThreadListEntry[] {
  return threads
    .filter(isThreadSavedForLater)
    .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}

/**
 * Threads saved for later. They stay live, so opening one continues the work
 * in place; it remains out of the main sidebar until moved back.
 */
export function SavedThreadsView() {
  const [search, setSearch] = useState("");
  const sidebarNavigation = useSidebarNavigation();
  const selection = useSidebarNavigationThreadSelection(selectSavedThreads);
  const restoreSavedThread = useRestoreSavedThread();

  const projectNames = useMemo(() => {
    const data = sidebarNavigation.data;
    if (!data) return new Map<string, string>();
    return new Map(
      [data.personalProject, ...data.projects].map((project) => [
        project.id,
        project.name,
      ]),
    );
  }, [sidebarNavigation.data]);

  const savedThreads = useMemo(() => {
    const threads = selection.data ?? [];
    const query = search.trim().toLocaleLowerCase();
    if (query.length === 0) return threads;
    return threads.filter((thread) =>
      getThreadDisplayTitle(thread).toLocaleLowerCase().includes(query),
    );
  }, [search, selection.data]);

  const groupedThreads = useMemo(() => {
    const groups = new Map<string, ThreadListEntry[]>();
    for (const thread of savedThreads) {
      const group = groups.get(thread.projectId);
      if (group) group.push(thread);
      else groups.set(thread.projectId, [thread]);
    }
    return [...groups.entries()];
  }, [savedThreads]);

  const totalSaved = selection.data?.length ?? 0;
  const isLoading =
    selection.data === undefined &&
    (selection.isBootstrapPending || sidebarNavigation.isPending);

  return (
    <div className="-mx-4 -mb-4 -mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:-mx-5 md:-mb-5 md:-mt-5">
      <section className="mx-auto w-full max-w-3xl space-y-5 px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Saved for later
          </h2>
          <p className="mt-1 text-xs text-subtle-foreground">
            Parked threads stay live and out of the sidebar. Open one to pick
            the work back up.
          </p>
        </div>

        {totalSaved > 0 ? (
          <div className="relative">
            <Icon
              name="Search"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground"
            />
            <Input
              aria-label="Search saved threads"
              className="h-8 pl-8 text-xs"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search saved threads…"
              value={search}
            />
          </div>
        ) : null}

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading saved threads…
          </p>
        ) : savedThreads.length === 0 ? (
          <EmptyStatePanel className="py-8">
            {totalSaved > 0
              ? "No saved threads match your search."
              : "Nothing saved yet. Use Save for later in a thread's menu."}
          </EmptyStatePanel>
        ) : (
          <div className="space-y-6">
            {groupedThreads.map(([groupProjectId, threads]) => (
              <section key={groupProjectId} className="space-y-2">
                <div className="flex items-center gap-2 px-0.5 text-xs font-medium text-muted-foreground">
                  <Icon name="Folder" className="size-3.5" />
                  <h3 className="min-w-0 flex-1 truncate">
                    {projectNames.get(groupProjectId) ?? "Unknown project"}
                  </h3>
                  <span>
                    {threads.length}{" "}
                    {threads.length === 1 ? "thread" : "threads"}
                  </span>
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-lg bg-surface-recessed">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                    >
                      <Link
                        className="min-w-0 flex-1"
                        data-testid="saved-thread-link"
                        to={getThreadRoutePath({
                          projectId: thread.projectId,
                          threadId: thread.id,
                        })}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-sm">
                          <span className="truncate">
                            {getThreadDisplayTitle(thread)}
                          </span>
                          {thread.parentThreadId !== null ? (
                            <Pill variant="outline" className="shrink-0">
                              child
                            </Pill>
                          ) : null}
                        </span>
                        {thread.savedAt != null ? (
                          <span className="mt-0.5 block text-xs text-subtle-foreground">
                            Saved{" "}
                            {formatRelativeTime({
                              timestamp: thread.savedAt,
                              now: Date.now(),
                            })}
                          </span>
                        ) : null}
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                        disabled={
                          restoreSavedThread.isPending &&
                          restoreSavedThread.variables?.id === thread.id
                        }
                        onClick={() =>
                          restoreSavedThread.mutate({ id: thread.id })
                        }
                      >
                        <Icon name="ArrowTurnBackward" className="size-3.5" />
                        Move to sidebar
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
