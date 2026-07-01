import { Link } from "react-router-dom";
import { trpcClient } from "../../trpcClient";
import { toast } from "sonner";
import { useState, useRef } from "react";
import HomeHeader from "./HomeComponents/HomeHeader";

export default function Home() {
  return (
    <div className="flex flex-col gap-2 w-full pt-2">
      <HomeHeader />
    </div>
  );
}
