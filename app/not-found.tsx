import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-4xl font-bold mb-4 text-red-500">404 - Not Found</h2>
      <p className="text-xl mb-8 text-slate-300">Could not find requested resource</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
      >
        Return Home
      </Link>
    </div>
  );
}
