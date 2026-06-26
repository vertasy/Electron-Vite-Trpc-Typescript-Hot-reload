import { useEffect, useState } from "react";
import {
  DatabaseIcon,
  PlusIcon,
  ArrowRightIcon,
  Loader,
  Hash,
  HashIcon
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

function SubmitButton({
  title,
  onClick,
  isLoading,
  back
}: {
  title: string;
  onClick: () => void;
  isLoading: boolean;
  back?: boolean;
}) {
  return (
    <button
      className={`
        ${
          back
            ? "bg-muted border text-primary/50 hover:text-primary/70 w-fit!"
            : "bg-primary text-background"
        }
        ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}
        group w-full border-border rounded-2xl py-2 px-4
        flex items-center justify-between transition-all duration-150
      `}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : title}

      {!back && (
        <span className="group-hover:translate-x-2 transition-all duration-150">
          {isLoading ? <Loader className="animate-spin" /> : <ArrowRightIcon />}
        </span>
      )}
    </button>
  );
}

function Input({
  type,
  placeholder,
  value,
  onChange
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="w-full h-12 rounded-2xl px-4 border border-border bg-muted focus-within:border-border-hover">
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
  setChannels,
  selectedChannel,
  setSelectedChannel
}: {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  selectedChannel: Channel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Channel | null>>;

  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full">
        <Select defaultValue={"Select a channel"}>
          <SelectTrigger className="w-full bg-muted! h-12">
            <SelectValue placeholder="Select a channel" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem
                className="h-10 px-2"
                value={channel.name}
                key={channel.id}
              >
                <span>
                  <HashIcon />
                </span>
                <span>{channel.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <SubmitButton
          title="Back"
          onClick={() => {
            onBack();
          }}
          isLoading={false}
          back
        />

        <SubmitButton title="Continue" onClick={() => {}} isLoading={false} />
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
  const [channels, setChannels] = useState<
    {
      id: string;
      name: string;
    }[]
  >([
    {
      id: "12313-1321-12314-112 ",
      name: "Dataset"
    },
    {
      id: "12313-1321-12314-112 ",
      name: "Photos"
    },
    {
      id: "12313-1321-12314-112 ",
      name: "Videos"
    }
  ]);

  const [selectedChannel, setSelectedChannel] = useState<{
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
      if (!res?.channels || !res.info)
        return toast.error("Invalid credentials");
      setStage(1);
      setChannels(res.channels);
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
        <ChannelSelectionForm
          channels={channels}
          setChannels={setChannels}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          onBack={() => setStage(0)}
        />
      </div>
    );
  }

  return (
    <div className="w-full pt-4 flex flex-col gap-2">
      <Input
        type="text"
        placeholder="Client ID"
        value={data.clientId}
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
  return <div className="pt-4">Existing setup form</div>;
}

export default function StartPage() {
  const [selectedRoute, setSelectedRoute] = useState<"new" | "existing">("new");

  const [stage, setStage] = useState(0);

  const [header, setHeader] = useState<HeaderState>({
    title: "Get Started",
    description: "Choose your case to use the app."
  });
  const [testValue, setTestValue] = useState("");
  const handleTestButton = async () => {
    const res = await trpcClient.test.query();
    setTestValue(res);
  };
  return (
    <main className="w-screen min-h-screen flex justify-center items-center">
      <div className="flex flex-col min-w-80 max-w-100">
        <button onClick={handleTestButton}>Click Text</button>
        <h3 className="text-3xl font-bold text-foreground">{testValue}</h3>
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
