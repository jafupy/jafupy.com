import { SearchIcon, CommandIcon } from "lucide-react";

export default function SearchButton() {
  const handleClick = () => {
    // Dispatch custom event to trigger search dialog
    window.dispatchEvent(new CustomEvent("open-search"));
    //@ts-expect-error
    window.posthog.capture("search_button_clicked");
  };
  // return;
  return (
    <button
      className="flex w-fit gap-2 px-4 pl-6 py-2 rounded-r-xl border-r border-y text-grey-100 -ml-2 -z-1 border-grey-100/20 backdrop-blur-md bg-grey-950/20 hover:bg-grey-950/30 text-sm items-center justify-center group"
      onClick={handleClick}
    >
      <SearchIcon className="size-4 group-hover:text-blue-200 transition-colors" />
    </button>
  );
}
