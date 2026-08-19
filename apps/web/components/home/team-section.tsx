import type { TeamMember } from "@/lib/cms/client";
import { TeamCard } from "./team-card";
import styles from "./team-section.module.css";

export function TeamSection({ title, team }: { title: string; team: TeamMember[] }) {
  return (
    <section id="team" className={styles.section}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>Команда</div>
          <h2 className={styles.title}>{title}</h2>
        </div>
      </div>
      <div className={styles.scroller} data-hscroll="">
        {team.map((m) => (
          <TeamCard key={m.name} member={m} />
        ))}
      </div>
    </section>
  );
}
