import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useState, useEffect } from "react";
import { actions } from "astro:actions";
import { useDebounce } from "$/hooks/useDebounce";
import type { FuseResult } from "fuse.js";
import {
  SearchIcon,
  FileTextIcon,
  TagIcon,
  CommandIcon,
  HomeIcon,
  UserRoundIcon,
  Link2Icon,
  ChevronRight,
  Slash,
} from "lucide-react";

interface Writing {
  title: string;
  description: string;
  tags?: string[];
  id: string;
  path?: string;
  body?: string;
  date: Date;
}

interface Page {
  name: string;
  path: string;
  icon: string;
}

type WritingResult = FuseResult<Writing>;
type PageResult = FuseResult<Page>;

export default function Cmdk() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    writing: WritingResult[];
    pages: PageResult[];
  }>({ writing: [], pages: [] });

  const debouncedQuery = useDebounce(query, 300);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        setOpen(!open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Handle custom event from search button
  useEffect(() => {
    const handleOpenSearch = () => {
      setOpen(!open);
    };

    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, [open]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ writing: [], pages: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await actions.search(debouncedQuery);
        setResults(data || { writing: [], pages: [] });
      } catch (error) {
        console.error("Search error:", error);
        setResults({ writing: [], pages: [] });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle selection
  const handleSelect = (
    item:
      | {
          writing: Writing;
          page?: undefined;
        }
      | {
          writing?: undefined;
          page: Page;
        },
  ) => {
    if (item.writing) {
      const blogPath = `/w/${new Date(item.writing.date).getFullYear()}/${item.writing.id.replace(".md", "").replace(".mdx", "")}`;
      window.location.href = blogPath;
    } else if (item.page) {
      window.location.href = item.page.path;
    }
    setOpen(false);
  };

  // Reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery("");
      setResults({ writing: [], pages: [] });
      setLoading(false);
    }
  };
  // useEffect(() => {
  //   console.log(results);
  // }, [results]);
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 backdrop-blur-sm [background-image:radial-gradient(_transparent_25%,_#0f1315cc_25%)] [background-size:4px_4px]" />
      <DialogContent className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <DialogTitle className="sr-only">Search Menu</DialogTitle>
        <Command
          shouldFilter={false}
          className="mx-auto bg-grey-950/95 backdrop-blur-md border border-grey-100/20 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-grey-100/10">
            <SearchIcon className="size-4 text-grey-400 mr-3" />
            <Command.Input
              placeholder="Search..."
              value={query}
              onValueChange={setQuery}
              className="flex-1 bg-transparent py-4 text-grey-100 placeholder-grey-400 outline-none text-sm font-default"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            {loading && (
              <Command.Loading className="flex items-center justify-center py-8 text-grey-400 text-sm">
                <div className="animate-spin size-4 border border-grey-400 border-t-transparent rounded-full mr-2" />
                Searching...
              </Command.Loading>
            )}
            {!loading &&
              query &&
              (results.writing.length === 0 || results.pages.length === 0) && (
                <Command.Empty className="flex flex-col items-center justify-center py-8 text-grey-400">
                  <SearchIcon className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{query}"</p>
                </Command.Empty>
              )}
            {/* {results.pages.map((e) => (
              <span>{JSON.stringify(e)}</span>
            ))} */}
            {!loading && query === "" && (
              <div className="h-[150px] flex flex-col items-center justify-center gap-3 p-3 rounded-lg text-grey-300 cursor-pointer transition-colors group">
                <SearchIcon />
                Start searching...
              </div>
            )}
            {results.pages.length > 0 && query && (
              <Command.Group>
                <h2 className="text-lg font-semibold my-2 ml-2">Pages</h2>

                {results.pages.map((result) => {
                  const Icon =
                    { HomeIcon, UserRoundIcon, FileTextIcon }[
                      result.item.icon
                    ] || FileTextIcon;

                  return (
                    <Command.Item
                      key={JSON.stringify(result)}
                      value={result.item.path}
                      onSelect={() => handleSelect({ page: result.item })}
                      className="flex items-start justify-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-grey-900/50 aria-selected:bg-grey-900/70 group"
                    >
                      <Icon className="size-4 text-grey-400 mt-0.5 flex-shrink-0 group-aria-selected:text-old-rose" />
                      <div className="flex-1 min-w-0 flex">
                        <h3 className="font-medium text-grey-100 text-sm line-clamp-1 group-aria-selected:text-white">
                          {result.item.name}
                        </h3>
                        <span className="text-sm text-grey-300 ml-auto">
                          {result.item.path.split("/").map((part, index) => {
                            if (part === "") {
                              return part;
                            }
                            return (
                              <>
                                {part}{" "}
                                {result.item.path.split("/").length > index && (
                                  <span className="text-xs text-grey-500">
                                    /
                                  </span>
                                )}
                              </>
                            );
                          })}
                        </span>
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {results.writing.length > 0 && query && (
              <Command.Group>
                <h2 className="text-lg font-semibold my-2 ml-2">Writing</h2>
                {results.writing.map((result) => (
                  <Command.Item
                    key={result.item.path}
                    value={result.item.id}
                    onSelect={() => handleSelect({ writing: result.item })}
                    className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 hover:bg-grey-900/50 aria-selected:bg-grey-900/70 group"
                  >
                    <FileTextIcon className="size-4 text-grey-400 mt-0.5 flex-shrink-0 group-aria-selected:text-old-rose" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-grey-100 text-sm line-clamp-1 group-aria-selected:text-white">
                        {result.item.title}
                      </h3>
                      {result.item.description && (
                        <p className="text-xs text-grey-400 mt-1 line-clamp-2 group-aria-selected:text-grey-300">
                          {result.item.description}
                        </p>
                      )}
                      {(result.item.tags || []).length > 0 && (
                        <div className="flex items-center justify-start gap-1 mt-2 flex-wrap">
                          <TagIcon className="size-3 text-grey-500" />

                          {(result.item.tags || []).slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs capitalize px-1.5 py-0.5 bg-grey-900/50 text-grey-400 rounded border border-grey-100/10 group-aria-selected:bg-old-rose/20 group-aria-selected:text-old-rose group-aria-selected:border-old-rose/30"
                            >
                              {tag}
                            </span>
                          ))}
                          {(result.item.tags || []).length > 4 && (
                            <span className="text-xs text-grey-500">
                              +{(result.item.tags || []).length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-grey-100/10 px-4 py-2 ">
            <div className="flex items-center justify-left text-xs text-grey-500">
              <span className="mr-auto flex justify-center items-center gap-1">
                <CommandIcon className="size-3" /> K
              </span>{" "}
              Site Search
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
