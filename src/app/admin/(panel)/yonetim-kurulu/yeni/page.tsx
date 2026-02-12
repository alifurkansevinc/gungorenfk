import Link from "next/link";
import { BoardMemberForm } from "../BoardMemberForm";

export default function AdminYonetimKuruluYeniPage() {
  return (
    <div>
      <Link href="/admin/yonetim-kurulu" className="text-sm text-bordo hover:underline">← Yönetim Kurulu</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni üye</h1>
      <BoardMemberForm />
    </div>
  );
}
