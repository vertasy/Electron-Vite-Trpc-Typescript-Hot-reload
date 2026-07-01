import {
  ArrowRight,
  Files,
  HomeIcon,
  Loader,
  RefreshCwIcon,
  SettingsIcon,
  Upload,
  UploadIcon,
  UsersRoundIcon
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaInstagram } from "react-icons/fa";

function ServerCard(props: ServerInfo) {
  return (
    <div
      className={
        "border border-border h-fit flex rounded-2xl py-1 bg-muted  px-1 w-full"
      }
    >
      <img src={props.serverPfp} alt="" className="w-17 h-17 rounded-xl" />
      <div className="flex flex-col gap-0 justify-center  px-3 relative overflow-hidden">
        <h2 className="font-medium text-lg text-foreground leading-4">
          {props.serverTitle}
        </h2>
        <p className="w-full truncate text-sm opacity-70">
          {props.serverDescription}
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>({
    serverTitle: "Database",
    serverDescription: "Personal Storage server.",
    serverPfp:
      "https://i.pinimg.com/736x/96/2f/da/962fda4090662e0cec7f6d42fef3f913.jpg",
    serverBanner: "",
    serverMemberCount: 0
  });
  const [syncLoading, setSyncLoading] = useState(false);
  return (
    <div
      className={
        "flex justify-between pt-2 pb-2 px-2 flex-col h-full w-67.5 min-w-67.5 border-r border-border"
      }
    >
      <div>
        <ServerCard {...serverInfo!} />
        <div className="flex flex-col items-center gap-5 mt-2 w-full">
          <button className="w-full cursor-pointer hover:bg-foreground/90 flex items-center gap-2 bg-foreground text-background  px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover">
            <span className="font-medium">Uplaod</span>
            <UploadIcon />
          </button>
          <span className="w-[50%] h-[1px] bg-border"></span>
          <nav className="w-full flex flex-col gap-2">
            <Link
              to="/"
              className="cursor-pointer flex items-center gap-2 bg-muted text-foreground  px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
            >
              <span className="font-medium">Home</span>
              <HomeIcon />
            </Link>
            <Link
              to="/"
              className="cursor-pointer flex items-center gap-2 bg-muted text-foreground  px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
            >
              <span className="font-medium">Files</span>
              <Files />
            </Link>
            <Link
              to="/"
              className="cursor-pointer flex items-center gap-2 bg-muted text-foreground  px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
            >
              <span className="font-medium">Persons</span>
              <UsersRoundIcon />
            </Link>
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <Link
          to="/settings"
          className="flex items-center gap-2 bg-muted px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
        >
          <span className="font-medium">Settings</span> <SettingsIcon />
        </Link>
        <button
          disabled={syncLoading}
          className="disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 bg-muted px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
        >
          <span>{syncLoading ? "Syncing..." : "Sync"}</span>
          {syncLoading ? (
            <Loader className="animate-spin" />
          ) : (
            <RefreshCwIcon />
          )}
        </button>
        <a
          href="https://www.instagram.com/vertasoo/"
          target="_blank"
          className="flex items-center group gap-2 bg-muted px-4 py-2 justify-between rounded-2xl border border-border hover:border-border-hover"
        >
          <span className="font-medium group-hover:underline">
            Made By Diaa
          </span>{" "}
          <FaInstagram size={23} />
        </a>
      </div>
    </div>
  );
}
