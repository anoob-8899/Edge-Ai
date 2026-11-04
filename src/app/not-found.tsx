import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F8FA] via-[#EDF3F7] to-[#E3ECF2] p-6 text-center">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-[#DCE8F5] rounded-3xl p-8 shadow-xl shadow-blue-500/5">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-[#1A73E8]/10 to-[#4285F4]/20 border border-[#4285F4]/30 flex items-center justify-center">
          <span className="text-2xl font-bold text-[#1A73E8]">404</span>
        </div>
        <h1 className="text-xl font-bold text-[#172B4D] mb-2">Page Not Found</h1>
        <p className="text-sm text-[#5E6C84] mb-6">
          The requested clinical resource, catalogue model, or training session could not be located.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#1A73E8] text-white text-sm font-semibold hover:bg-[#1557B0] transition-colors shadow-sm"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
