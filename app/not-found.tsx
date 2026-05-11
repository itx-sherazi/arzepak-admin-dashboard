import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">This page doesn&apos;t exist.</p>
        <Link href="/dashboard" className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
