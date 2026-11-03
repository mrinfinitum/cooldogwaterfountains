import type { Address, Order } from "@/lib/account";

const TONE: Record<string, string> = {
  processing: "bg-aqua-light text-ink",
  completed: "bg-teal text-white",
  "on-hold": "bg-[#f4e3b5] text-ink",
  pending: "bg-[#f4e3b5] text-ink",
  cancelled: "bg-line text-ink/70",
  refunded: "bg-line text-ink/70",
  failed: "bg-[#f3c9c4] text-ink",
};

/** Customer-facing wording for WooCommerce order statuses. */
const LABEL: Record<string, string> = {
  processing: "Paid – preparing",
  completed: "Shipped",
  "on-hold": "Awaiting invoice payment",
};

export function StatusBadge({ order }: { order: Pick<Order, "status" | "statusLabel"> }) {
  return (
    <span className={`eyebrow inline-block px-2.5 py-1 text-[10px] ${TONE[order.status] ?? "bg-mist text-ink"}`}>
      {LABEL[order.status] ?? order.statusLabel}
    </span>
  );
}

export function AddressBlock({ address }: { address?: Address }) {
  if (!address?.line1) return <p className="text-[15px] text-muted">Not saved yet.</p>;
  return (
    <p className="text-[15px] leading-relaxed">
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.postalCode}
    </p>
  );
}
