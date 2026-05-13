export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-light-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="border-divider w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
