import { ACTIVITIES, THEMES, ZONES } from "@/lib/event-content";
import { WeekShell } from "@/components/week-shell";
export default function DirectoryPage() {
  return (
    <WeekShell idleSeconds={30}>
      <div className="page-intro">
        <p className="week-eyebrow">THE EVENT DIRECTORY</p>
        <h1>
          Math Week
          <br />
          <span>Event Directory</span>
        </h1>
        <p>
          Browse the theme schedule, planned activities and exhibition
          locations. 19–25 October 2026, during library opening hours.
        </p>
      </div>
      <section className="directory-section">
        <div className="section-heading">
          <h2>Themes and dates</h2>
          <span className="section-note">19–25 October 2026</span>
        </div>
        <div className="theme-list">
          {THEMES.map((t, i) => (
            <details key={t.days} className="theme-item">
              <summary>
                <span className="rank-number">0{i + 1}</span>
                <div>
                  <span className="week-eyebrow">
                    {t.from.slice(8)}–{t.to.slice(8)} October · {t.days}
                  </span>
                  <h3>{t.theme.replace("Mathematics in ", "")}</h3>
                </div>
                <span className="theme-plus">+</span>
              </summary>
              <div className="theme-programmes">
                {t.programmes.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="directory-section">
        <div className="section-heading">
          <h2>Planned activities</h2>
        </div>
        <div className="activity-grid">
          {ACTIVITIES.map((a, i) => (
            <article className="activity-card" key={a.category}>
              <span className="week-eyebrow">0{i + 1} / DISCOVER</span>
              <h3>{a.category}</h3>
              <p>{a.detail.replace(" (/puzzle/…).", ".")}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="directory-section">
        <div className="section-heading">
          <h2>Exhibition and activity locations</h2>
          <span className="section-note">
            Provisional locations · confirm with staff
          </span>
        </div>
        <div className="zone-grid">
          {ZONES.map((z) => (
            <article key={z.zone}>
              <h3>{z.zone}</h3>
              <ul>
                {z.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </WeekShell>
  );
}
