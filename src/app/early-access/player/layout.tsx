export default function EarlyAccessPlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="fixed inset-0 bg-black">{children}</div>;
}