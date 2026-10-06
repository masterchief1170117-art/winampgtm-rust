import { createFileRoute } from "@tanstack/react-router";
import { Player } from "@/components/player/Player";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Player />;
}
