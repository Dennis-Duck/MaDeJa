import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black text-center px-4">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <h2 className="text-2xl mt-4 text-black dark:text-white">
        Oops! Page not found
      </h2>
      <p className="mt-2 text-zinc-700 dark:text-zinc-300 max-w-md">
        The page you are looking for doesn’t exist. Maybe you want to go back to the homepage or start a new tease?
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
      >
        Go to Home
      </Link>
      <Link
        href="/wizard"
        className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition"
      >
        Start Wizard
      </Link>
    </div>
  );
}
