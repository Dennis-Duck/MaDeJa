import FlirtsList from "@/components/flirts-list";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to easyflirties</h1>
      <Link href="/wizard">Start Wizard</Link>
      <FlirtsList />
    </div>
  );
}
