import { SearchIcon, UploadIcon } from "lucide-react";
import { useUploadStore } from "../../../store/upload";

export default function HomeHeader() {
  const open = useUploadStore((s) => s.open);
  return (
    <header className="w-full flex justify-between items-center px-2 gap-2">
      <div className="flex w-120 h-12 border border-border rounded-2xl items-center focus-within:border-border-hover">
        <span className="w-10 h-full flex items-center justify-center mx-2">
          <SearchIcon className="text-foreground/50" />
        </span>
        <input
          type="text"
          placeholder="Search"
          className="w-full h-full outline-none border-none"
        />
        <div className="h-full">
          <button
            className={
              "cursor-pointer text-base font-medium h-full hover:bg-muted/90 w-fit bg-muted border-border border-l text-foreground rounded-2xl px-4"
            }
          >
            Search
          </button>
        </div>
      </div>
      <div>
        <button
          onClick={open}
          className="w-30 h-12 cursor-pointer hover:bg-foreground/90 flex items-center gap-2 bg-foreground text-background  px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
        >
          <span>Upload</span>
          <UploadIcon />
        </button>
      </div>
    </header>
  );
}
