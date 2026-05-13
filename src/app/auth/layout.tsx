export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-bg px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-divider bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
