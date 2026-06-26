import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "../../../components/input-otp";
import { SubmitButton } from "./Start";
import { useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "../../../trpcClient";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/auth";
import { useSetupStore } from "../../../store/setup";
export default function CodeSetupPage() {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const unlock = useAuthStore((state) => state.unlock);
  const setStage = useSetupStore((s) => s.setStage);
  const handleSubmit = async () => {
    if (!code || code.length !== 4) {
      toast.error("Please enter a code");
      return;
    }
    try {
      setLoading(true);
      const res = await trpcClient.start.setCode.query({ code });
      if (!res) {
        toast.error("Failed to set code");
        return;
      }
      unlock();
      console.log(res);
      setStage(2);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Failed to set code");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-screen min-h-screen flex justify-center items-center">
      <div className="flex flex-col min-w-80 max-w-80 gap-2">
        <div>
          <h2 className="text-3xl font-bold">Setup a Pin</h2>

          <p className="opacity-70">Choose a secure 4-digit PIN.</p>
        </div>
        <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} onChange={setCode}>
          <InputOTPGroup className="bg-muted! border border-border">
            <InputOTPSlot
              index={0}
              className="h-10 w-10 text-2xl border-r border-border"
            />
            <InputOTPSlot
              index={1}
              className="h-10 w-10 text-2xl border-r border-border"
            />
            <InputOTPSlot
              index={2}
              className="h-10 w-10 text-2xl border-r border-border"
            />
            <InputOTPSlot
              index={3}
              className="h-10 w-10 text-2xl border-r border-border focus-within:border-border-hover"
            />
          </InputOTPGroup>
        </InputOTP>
        <SubmitButton
          title="Continue"
          onClick={handleSubmit}
          isLoading={loading}
        />
        <span className="text-sm opacity-70 w-full">
          Make sure you never forget it, you won't be able to recover ur files .
        </span>
      </div>
    </main>
  );
}
