import { useEffect, useRef, useState } from "react";
import {
  DatabaseIcon,
  PlusIcon,
  ArrowRightIcon,
  Loader,
  Hash,
  HashIcon,
  TriangleAlert,
  RefreshCwIcon,
  FileUpIcon,
  XIcon
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../components/select";
import { trpcClient } from "../../../trpcClient";
import { useNavigate } from "react-router-dom";
import { useSetupStore } from "../../../store/setup";

type HeaderState = {
  title: string;
  description: string;
};

function RouteOptionCard({
  title,
  description,
  onClick,
  type,
  activeState
}: {
  title: string;
  description: string;
  onClick: () => void;
  type: "new" | "existing";
  activeState: number;
}) {
  return (
    <div
      className={`w-full rounded-2xl flex items-stretch px-4 bg-muted cursor-pointer
      border-2 transition-colors duration-150 relative
      ${
        activeState === 1
          ? "border-blue-600"
          : "border-border hover:border-border-hover"
      }`}
      onClick={onClick}
    >
      <span
        className={`absolute top-3 right-3 w-3 h-3 rounded-full transition-colors duration-150
        ${activeState === 1 ? "bg-blue-500" : "bg-transparent"}`}
      />

      <div className="aspect-square self-stretch rounded-2xl flex items-center justify-center pr-2 pl-1">
        {type === "new" ? (
          <PlusIcon
            size={30}
            className={activeState === 1 ? "text-blue-600" : "text-foreground"}
          />
        ) : (
          <DatabaseIcon
            size={25}
            className={activeState === 1 ? "text-blue-600" : "text-foreground"}
          />
        )}
      </div>

      <div className="p-4 flex flex-col">
        <h2 className="font-medium">{title}</h2>
        <p className="opacity-70 text-sm">{description}</p>
      </div>
    </div>
  );
}

export function SubmitButton({
  title,
  onClick,
  isLoading,
  back,
  refresh,
  disabled
}: {
  title: string;
  onClick: () => void;
  isLoading: boolean;
  back?: boolean;
  refresh?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`
        ${
          back
            ? "bg-muted border text-primary/50 hover:text-primary/70 w-fit!"
            : "bg-primary text-background"
        }
        ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}
        group w-full border-border rounded-2xl py-2 px-4
        flex items-center justify-between transition-all duration-150 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50
      `}
      onClick={onClick}
      // disabled={isLoading}
    >
      {isLoading && !refresh ? "Loading..." : title}

      {!back && (
        <span className="group-hover:translate-x-2 transition-all duration-150">
          {isLoading ? <Loader className="animate-spin" /> : <ArrowRightIcon />}
        </span>
      )}
      {refresh && (
        <span className="">
          {isLoading ? <Loader className="animate-spin" /> : <RefreshCwIcon />}
        </span>
      )}
    </button>
  );
}

function Input({
  type,
  placeholder,
  value,
  onChange,
  loading
}: {
  type: string;
  placeholder: string;
  value: string;
  loading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      className={`${loading ? "pointer-events-none" : ""} w-full h-12 rounded-2xl px-4 border border-border bg-muted focus-within:border-border-hover`}
    >
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full h-full outline-none bg-transparent"
      />
    </div>
  );
}

type Channel = {
  id: string;
  name: string;
};

function ChannelSelectionForm({
  onBack,
  channels,
  selectedChannel,
  setSelectedChannel,
  selectedFilesChannel,
  setSelectedFilesChannel
}: {
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  selectedFilesChannel: Channel | null;
  setSelectedFilesChannel: React.Dispatch<React.SetStateAction<Channel | null>>;
  onBack: () => void;
}) {
  const setStage = useSetupStore((state) => state.setStage);
  const navigate = useNavigate();
  const [localChannels, setLocalChannels] = useState<Channel[] | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use refreshed channels if available, otherwise use props
  const displayChannels = localChannels ?? channels;

  const handleRefresh = async () => {
    try {
      setRefreshLoading(true);

      const res = await trpcClient.start.refreshChannels.query();
      if (!res) {
        toast.error("Failed to refresh channels");
        return;
      }

      setLocalChannels(res);

      // Clear selections if they no longer exist
      if (selectedChannel && !res.some((c) => c.id === selectedChannel.id)) {
        setSelectedChannel(null);
      }

      if (
        selectedFilesChannel &&
        !res.some((c) => c.id === selectedFilesChannel.id)
      ) {
        setSelectedFilesChannel(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleSelectChannel = async () => {
    if (!selectedChannel) {
      toast.error("Please select the bot channel");
      return;
    }

    if (!selectedFilesChannel) {
      toast.error("Please select the files channel");
      return;
    }

    try {
      setLoading(true);

      const res = await trpcClient.start.selecChannel.query({
        channelId: selectedFilesChannel.id,
        dbChannelId: selectedChannel.id
      });

      if (!res) {
        toast.error("Failed to select channels");
        return;
      }
      setStage(1); // update immediately
      navigate("/start/code-setup");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const botChannelOptions = displayChannels.filter(
    (c) => c.id !== selectedFilesChannel?.id
  );

  const filesChannelOptions = displayChannels.filter(
    (c) => c.id !== selectedChannel?.id
  );

  return (
    <div className="flex flex-col gap-4">
      {displayChannels.length === 0 ? (
        <div className="flex flex-col gap-2 w-full">
          <div className="border bg-muted border-amber-300 rounded-2xl px-4 py-2 flex items-center gap-2">
            <TriangleAlert className="text-amber-300" />
            <span>
              Your server has no channels, please create one and refresh.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full">
            <h2 className="font-medium mb-1">MetaData Channel</h2>

            <Select
              value={selectedChannel?.id}
              onValueChange={(value) => {
                const channel = displayChannels.find((c) => c.id === value);
                setSelectedChannel(channel ?? null);
              }}
            >
              <SelectTrigger className="w-full h-12 bg-muted">
                <SelectValue placeholder="Select the bot channel" />
              </SelectTrigger>

              <SelectContent>
                {botChannelOptions.map((channel) => (
                  <SelectItem
                    key={channel.id}
                    value={channel.id}
                    className="h-10 px-2"
                  >
                    <HashIcon className="mr-2 h-4 w-4" />
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <h2 className="font-medium mb-1">Files Channel</h2>

            <Select
              value={selectedFilesChannel?.id}
              onValueChange={(value) => {
                const channel = displayChannels.find((c) => c.id === value);
                setSelectedFilesChannel(channel ?? null);
              }}
            >
              <SelectTrigger className="w-full h-12 bg-muted">
                <SelectValue placeholder="Select the files channel" />
              </SelectTrigger>

              <SelectContent>
                {filesChannelOptions.map((channel) => (
                  <SelectItem
                    key={channel.id}
                    value={channel.id}
                    className="h-10 px-2"
                  >
                    <HashIcon className="mr-2 h-4 w-4" />
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <SubmitButton title="Back" onClick={onBack} isLoading={false} back />

        <SubmitButton
          title=""
          onClick={handleRefresh}
          isLoading={refreshLoading}
          refresh
          back
        />

        <SubmitButton
          title="Continue"
          disabled={
            displayChannels.length < 2 ||
            !selectedChannel ||
            !selectedFilesChannel
          }
          onClick={handleSelectChannel}
          isLoading={loading}
        />
      </div>
    </div>
  );
}

function ServerInfoCard({
  serverInfo,
  channels
}: {
  serverInfo: ServerInfo;
  channels: Channel[];
}) {
  return (
    <div className="flex flex-row gap-2 border border-border rounded-2xl p-2 mb-2 bg-muted">
      <img src={serverInfo.serverPfp} alt="" className="w-17 h-17 rounded-xl" />
      <div className="flex flex-col gap-0 pt-2 relative overflow-hidden">
        <h2 className="font-medium text-lg text-foreground leading-4">
          {serverInfo.serverTitle}
        </h2>
        <p className="w-full truncate text-sm opacity-70">
          {serverInfo.serverDescription}
        </p>
        <div className="flex flex-row gap-2 mt-1">
          <span className="border border-border-hover font-thin text-sm rounded-full px-2 py-0 opacity-100 bg-foreground text-background">
            {serverInfo.serverMemberCount} members
          </span>
        </div>
      </div>
    </div>
  );
}

function NewSetupForm({
  onBack,
  setHeader
}: {
  onBack: () => void;
  setHeader: React.Dispatch<React.SetStateAction<HeaderState>>;
}) {
  const [stage, setStage] = useState(0);

  const [data, setData] = useState({
    clientId: "",
    serverId: "",
    botToken: ""
  });

  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [channels, setChannels] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);

  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedFilesChannel, setSelectedFilesChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const headers = {
      0: {
        title: "New Setup",
        description: "Enter your Discord credentials."
      },
      1: {
        title: "Choose a Channel",
        description: "Choose a channel to save your files at."
      }
    };

    setHeader(headers[stage as 0 | 1]);
  }, [stage, setHeader]);

  const handleSubmitCred = async () => {
    setLoading(true);
    try {
      if (!data.clientId || !data.serverId || !data.botToken) {
        toast.error("Please enter all the credentials");
        return;
      }
      const res = await trpcClient.start.newSetup.query({
        clientId: data.clientId,
        serverId: data.serverId,
        botToken: data.botToken
      });
      console.log(res);
      if (!res?.channels || !res.info)
        return toast.error("Invalid credentials");
      setStage(1);
      setChannels(res.channels);
      setServerInfo(res.info);
      console.log("channels", res.channels);
      console.log("info", res.info);
    } catch (error) {
      toast.error("Invalid credentials");
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (stage === 1) {
    return (
      <div className="pt-4">
        {serverInfo && (
          <ServerInfoCard channels={channels} serverInfo={serverInfo} />
        )}
        <ChannelSelectionForm
          selectedFilesChannel={selectedFilesChannel}
          setSelectedFilesChannel={setSelectedFilesChannel}
          channels={channels}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          onBack={() => setStage(0)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${loading ? "animate-pulse pointer-events-auto cursor-wait select-none" : ""} w-full pt-4 flex flex-col gap-2`}
    >
      <Input
        type="text"
        placeholder="Client ID"
        value={data.clientId}
        loading={loading}
        onChange={(e) =>
          setData({
            ...data,
            clientId: e.target.value
          })
        }
      />

      <Input
        type="text"
        placeholder="Server ID"
        value={data.serverId}
        loading={loading}
        onChange={(e) =>
          setData({
            ...data,
            serverId: e.target.value
          })
        }
      />

      <Input
        type="text"
        placeholder="Bot Token"
        value={data.botToken}
        loading={loading}
        onChange={(e) =>
          setData({
            ...data,
            botToken: e.target.value
          })
        }
      />

      <div className="flex gap-2">
        <SubmitButton
          title="Back"
          onClick={() => {
            setHeader({
              title: "Get Started",
              description: "Choose your case to use the app."
            });
            onBack();
          }}
          isLoading={false}
          disabled={loading}
          back
        />

        <SubmitButton
          title="Continue"
          onClick={handleSubmitCred}
          isLoading={loading}
        />
      </div>
    </div>
  );
}

function ExistingSetupForm() {
  const [restoreString, setRestoreString] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const setStage = useSetupStore((state) => state.setStage);
  // Updated type – no longer tied to the File object
  type SelectedFile = {
    name: string;
    path: string;
    file?: File; // optional, only available from drag-and-drop
  };

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(false);

  // Handles a dragged/dropped file using the Electron webUtils API
  const handleFile = (file: File) => {
    const path = window.electron.getPathForFile(file);
    setSelectedFile({
      name: file.name,
      path,
      file // keep the File object if you need its content later
    });
  };

  const navigate = useNavigate();
  // Handles the native dialog click (no input element)
  const handleOpenDialog = async () => {
    const result = await window.electron.openFileDialog();
    if (!result) return; // user cancelled
    setSelectedFile({
      name: result.name,
      path: result.path
      // no file object – if you need the content, read it via another IPC call later
    });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;
    handleFile(file);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (restoreString && restoreString.length > 0) {
        const res = await trpcClient.sync.pullLatestDb.query(restoreString);
        console.log(res);
        setStage(1);
        navigate("/start/pin", { replace: true });
        return;
      }

      if (selectedFile) {
        const res = await trpcClient.sync.uploadDb.query({
          path: selectedFile.path
        });
        setStage(1);
        navigate("/start/pin", { replace: true });
        console.log(res);
        return;
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 w-full flex flex-col gap-2">
      <div className="flex flex-col">
        <Input
          type="text"
          placeholder="Restore String"
          value={restoreString}
          onChange={(e) => setRestoreString(e.target.value)}
        />

        <span className="text-foreground/70 text-center w-full my-2">
          - or -
        </span>

        {/* CLICK AREA – now uses native dialog, no hidden input */}
        <div
          onClick={handleOpenDialog} // <-- changed
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDragging(false);
          }}
          onDrop={onDrop}
          className={`relative h-45 rounded-3xl cursor-pointer transition-all
          ${
            isDragging
              ? "border-2 border-dashed border-primary bg-primary/5"
              : "border border-border hover:border-border-hover bg-muted"
          }`}
        >
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center h-full opacity-70 pointer-events-none">
              <FileUpIcon size={32} />
              <span className="text-sm mt-2 max-w-[170px] text-center">
                Click here or Drag your file to upload.
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute top-3 right-3 rounded-full p-1 hover:bg-destructive/10"
              >
                <XIcon size={18} />
              </button>

              <div className="flex flex-col justify-center h-full px-6">
                <div className="font-medium truncate">{selectedFile.name}</div>
                <div className="text-sm text-muted-foreground truncate mt-1">
                  {selectedFile.path}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <SubmitButton
        title="Continue"
        onClick={handleSubmit}
        isLoading={loading}
      />
    </div>
  );
}

export default function StartPage() {
  const [selectedRoute, setSelectedRoute] = useState<"new" | "existing">("new");

  const [stage, setStage] = useState(0);

  const [header, setHeader] = useState<HeaderState>({
    title: "Get Started",
    description: "Choose your case to use the app."
  });

  return (
    <main className="w-screen min-h-screen flex justify-center items-center">
      <div className="flex flex-col min-w-80 max-w-100">
        <div>
          <h2 className="text-3xl font-bold">{header.title}</h2>

          <p className="opacity-70">{header.description}</p>
        </div>

        {stage === 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <RouteOptionCard
              type="new"
              title="New Setup"
              description="Start a new app setup."
              onClick={() => setSelectedRoute("new")}
              activeState={selectedRoute === "new" ? 1 : 0}
            />

            <RouteOptionCard
              type="existing"
              title="Existing Setup"
              description="Use your existing app setup."
              onClick={() => setSelectedRoute("existing")}
              activeState={selectedRoute === "existing" ? 1 : 0}
            />

            <SubmitButton
              title="Next"
              isLoading={false}
              onClick={() => {
                if (selectedRoute === "new") {
                  setStage(1);
                } else {
                  setHeader({
                    title: "Existing Setup",
                    description: "Use your existing app setup."
                  });

                  setStage(1);
                }
              }}
            />
          </div>
        )}

        {stage === 1 && (
          <>
            {selectedRoute === "new" && (
              <NewSetupForm
                onBack={() => {
                  setHeader({
                    title: "Get Started",
                    description: "Choose your case to use the app."
                  });

                  setStage(0);
                }}
                setHeader={setHeader}
              />
            )}

            {selectedRoute === "existing" && <ExistingSetupForm />}
          </>
        )}
      </div>
    </main>
  );
}
