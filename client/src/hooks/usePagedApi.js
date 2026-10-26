import { useEffect, useState } from "react";
import { apiRequest, buildPath } from "../services/api";

// Loads a list from the API one page at a time, with a "load more" action.
//
//   const list = usePagedApi("/api/projects", { service: "marble" }, 9);
//
//   list.status       "loading", "ready" or "error" (for the FIRST page)
//   list.items        everything loaded so far (as the API sends it)
//   list.total        how many exist in total
//   list.hasMore      whether another page is available
//   list.loadingMore  true while "load more" is in progress
//   list.moreError    set if "load more" failed (the items already shown stay)
//   list.loadMore()   fetches the next page and adds it
//   list.reload()     starts again from the first page (for example, after an error)
//
// When the path or the filters change, it starts again from the first page by itself.
export default function usePagedApi(path, query = {}, pageSize = 12) {
  const queryKey = JSON.stringify(query);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    key: null,
    items: [],
    page: 1,
    total: 0,
    hasMore: false,
    error: null,
    loadingMore: false,
    moreError: null,
  });

  // Identifies the current list. A stored result only counts if it belongs to the current list,
  // which is how "loading" appears again when the filters change.
  const key = `${path}|${queryKey}|${pageSize}|${attempt}`;

  // The first page, whenever the filters change (or after reload()).
  useEffect(() => {
    const controller = new AbortController();
    const url = buildPath(path, {
      ...JSON.parse(queryKey),
      page: 1,
      limit: pageSize,
    });

    apiRequest(url, { signal: controller.signal }).then(
      (data) =>
        setState({
          key,
          items: data.items,
          page: 1,
          total: data.total,
          hasMore: data.hasMore,
          error: null,
          loadingMore: false,
          moreError: null,
        }),
      (error) => {
        if (error.name === "AbortError") return;
        setState({
          key,
          items: [],
          page: 1,
          total: 0,
          hasMore: false,
          error,
          loadingMore: false,
          moreError: null,
        });
      },
    );

    return () => controller.abort();
  }, [path, queryKey, pageSize, key]);

  const current = state.key === key ? state : null;

  function loadMore() {
    if (!current || !current.hasMore || current.loadingMore) return;

    const nextPage = current.page + 1;
    setState({ ...current, loadingMore: true, moreError: null });

    const url = buildPath(path, {
      ...JSON.parse(queryKey),
      page: nextPage,
      limit: pageSize,
    });
    apiRequest(url).then(
      (data) =>
        setState((latest) => {
          if (latest.key !== key) return latest; // the filters changed while this was loading
          // If something new was published in the meantime, a project could shift onto this page twice.
          const known = new Set(latest.items.map((item) => item.id));
          const fresh = data.items.filter((item) => !known.has(item.id));
          return {
            ...latest,
            items: [...latest.items, ...fresh],
            page: nextPage,
            total: data.total,
            hasMore: data.hasMore,
            loadingMore: false,
          };
        }),
      (error) =>
        setState((latest) =>
          latest.key === key
            ? { ...latest, loadingMore: false, moreError: error }
            : latest,
        ),
    );
  }

  let status = "loading";
  if (current) status = current.error ? "error" : "ready";

  // Changes the loaded items without reloading, for example after an admin action.
  // updater(items) must return the new list. Removing items lowers the total to match.
  function patchItems(updater) {
    setState((latest) => {
      if (latest.key !== key) return latest;
      const items = updater(latest.items);
      return {
        ...latest,
        items,
        total: Math.max(0, latest.total - (latest.items.length - items.length)),
      };
    });
  }

  return {
    status,
    items: current?.items ?? [],
    total: current?.total ?? 0,
    hasMore: current?.hasMore ?? false,
    loadingMore: current?.loadingMore ?? false,
    moreError: current?.moreError ?? null,
    error: current?.error ?? null,
    loadMore,
    patchItems,
    reload: () => setAttempt((count) => count + 1),
  };
}
