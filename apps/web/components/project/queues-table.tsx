import type { Queue } from "@/lib/cms/client";
import styles from "./queues-table.module.css";

function isDelivered(delivery: string | null): boolean | null {
  if (!delivery) return null;
  const match = delivery.match(/(\d)\s*кв\S*\s*(\d{4})/i);
  if (!match) return null;
  const quarter = Number(match[1]);
  const year = Number(match[2]);
  const quarterEndMonth = quarter * 3 - 1; // 0-indexed month of quarter end
  const deliveryEnd = new Date(year, quarterEndMonth + 1, 0);
  return deliveryEnd.getTime() <= Date.now();
}

export function QueuesTable({ queues }: { queues: Queue[] }) {
  if (!queues.length) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>№</div>
        <div>Корпус</div>
        <div>Сдача</div>
        <div className={styles.statusRight}>Статус</div>
      </div>
      {queues.map((q) => {
        const delivered = isDelivered(q.delivery);
        return (
          <div className={styles.row} key={`${q.number}-${q.building}`}>
            <div className={styles.num}>{String(q.number).padStart(2, "0")}</div>
            <div className={styles.name}>{q.building ?? "—"}</div>
            <div className={styles.date}>{q.delivery ?? "—"}</div>
            <div
              className={styles.status}
              style={{ color: delivered === null ? "var(--muted)" : delivered ? "#16A34A" : "var(--muted)" }}
            >
              {delivered === null ? "—" : delivered ? "Сдан" : "Строится"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
