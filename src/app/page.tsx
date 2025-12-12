import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welkom bij MaDeJa</h1>
      <Link href="/wizard">Start Wizard</Link>
    </div>
  );
}
