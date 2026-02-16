import Link from "next/link";
import { TransferFormu } from "../TransferFormu";

export default function AdminTransferYeniPage() {
  return (
    <div>
      <Link href="/admin/transferler" className="text-sm text-bordo hover:underline">← Transferler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni transfer</h1>
      <TransferFormu />
    </div>
  );
}
