import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "../../../components/input-otp";
import { SubmitButton } from "./Start";
import { trpcClient } from "../../../trpcClient";
import { useAuthStore } from "../../../store/auth";

export default function PinPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const unlock = useAuthStore((state) => state.unlock);

  const handleSubmit = async () => {
    if (code.length !== 4) {
      toast.error("Please enter your 4-digit PIN.");
      return;
    }

    try {
      setLoading(true);

      const valid = await trpcClient.start.checkCode.query({ code });

      if (!valid) {
        toast.error("Invalid PIN.");
        return;
      }

      unlock();

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-screen items-center justify-center">
      <div className="flex min-w-80 max-w-80 flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold">Enter PIN</h2>

          <p className="opacity-70">
            Please enter your 4-digit PIN to continue.
          </p>
        </div>

        <InputOTP
          maxLength={4}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={setCode}
        >
          <InputOTPGroup className="border border-border bg-muted">
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-10 w-10 border-r border-border text-2xl"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <SubmitButton
          title="Continue"
          onClick={handleSubmit}
          isLoading={loading}
          disabled={code.length !== 4}
        />
      </div>
    </main>
  );
}
