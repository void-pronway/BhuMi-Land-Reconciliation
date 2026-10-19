import Workspace from "@/components/workspace";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const p = await searchParams;
  return <Workspace initialView={p.view === "login" ? "login" : "home"} />;
}
