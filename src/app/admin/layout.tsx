import AdminNavbar from "@/components/layout/AdminNavbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminNavbar>
        {children}
      </AdminNavbar>
    </>
  )
}
