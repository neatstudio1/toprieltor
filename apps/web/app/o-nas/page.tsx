import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";
import {
  AGENT_NAME,
  AGENT_PHOTO,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
  MANAGER_NAME,
  PHONE_DISPLAY,
  PHONE_TEL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `${AGENT_NAME} — риелтор по новостройкам в Екатеринбурге`,
  description: `${AGENT_NAME}, сооснователь агентства ${SITE_NAME}: подбор новостроек в Екатеринбурге с 2019 года, более 100 сделок, сертифицированный дизайнер интерьеров.`,
  alternates: { canonical: "/o-nas" },
  openGraph: {
    title: `${AGENT_NAME} — риелтор по новостройкам в Екатеринбурге`,
    description: `Сооснователь ${SITE_NAME}. Подбор новостроек с 2019 года, более 100 сделок.`,
    url: "/o-nas",
    images: [{ url: AGENT_PHOTO }],
  },
};

// Person, а не только организация: страницу читают и журналисты, и поисковики —
// обоим нужно понимать, кто именно отвечает за советы про чужие деньги.
function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AGENT_NAME,
    jobTitle: "Риелтор по новостройкам, сооснователь агентства",
    image: `${SITE_URL}${AGENT_PHOTO}`,
    url: `${SITE_URL}/o-nas`,
    telephone: PHONE_TEL,
    sameAs: [TELEGRAM_URL],
    knowsAbout: [
      "Новостройки Екатеринбурга",
      "Ипотека",
      "Семейная ипотека",
      "Материнский капитал",
      "Приёмка квартиры",
      "Дизайн интерьера",
    ],
    worksFor: {
      "@type": "RealEstateAgent",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      telephone: PHONE_TEL,
      areaServed: { "@type": "City", name: "Екатеринбург" },
    },
  };
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={personSchema()} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "О нас", path: "/o-nas" },
        ])}
      />
      <SiteHeader />

      <div className={styles.wrap}>
        <div className={styles.crumbs}>
          <Link href="/">Главная</Link> / О нас
        </div>

        <div className={styles.hero}>
          <div className={styles.photoFrame}>
            <img
              src={AGENT_PHOTO}
              alt={`${AGENT_NAME} — сооснователь агентства ${SITE_NAME}`}
              width={800}
              height={1199}
              className={styles.photo}
            />
          </div>

          <div>
            <div className={styles.eyebrow}>Сооснователь агентства</div>
            <h1 className={styles.name}>{AGENT_NAME}</h1>
            <p className={styles.role}>
              Подбираю новостройки в Екатеринбурге с 2019 года. Веду сделку целиком: от первого разговора
              о бюджете до момента, когда вы забираете ключи и начинаете ремонт.
            </p>

            <div className={styles.facts}>
              <div className={styles.fact}>
                <div className={styles.factValue}>с 2019</div>
                <div className={styles.factLabel}>на рынке новостроек Екатеринбурга</div>
              </div>
              <div className={styles.fact}>
                <div className={styles.factValue}>100+</div>
                <div className={styles.factLabel}>семей выбрали квартиру со мной</div>
              </div>
              <div className={styles.fact}>
                <div className={styles.factValue}>Дизайнер</div>
                <div className={styles.factLabel}>сертифицированный дизайнер интерьеров</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.block}>
            <h2>Что я делаю</h2>
            <p>
              Работаю только с новостройками Екатеринбурга — это осознанное ограничение. Рынок
              первички живёт своими правилами: аккредитации, эскроу, субсидированные ставки от
              застройщиков, сроки сдачи, которые сдвигаются. Знать это всё вперемешку со вторичкой и
              загородкой невозможно, а ошибка здесь стоит миллионы.
            </p>
            <p>
              В нашей базе 40 жилых комплексов и больше двух с половиной тысяч квартир. Я знаю, в
              каком корпусе окна выходят на парковку, у какого застройщика сдвигались сроки и где
              заявленная «предчистовая» отделка на деле означает лишние 300 тысяч на выравнивание
              стен. Этого нет в рекламных буклетах.
            </p>
          </div>

          <div className={styles.block}>
            <h2>Почему дизайнерское образование здесь важно</h2>
            <p>
              Я сертифицированный дизайнер интерьеров, и на просмотре это меняет разговор. Планировка,
              которая на картинке выглядит просторной, часто не разделяется на нужные зоны: узкий
              коридор, несущая стена посреди комнаты, кухня, куда не встаёт нормальный гарнитур.
            </p>
            <p>
              На квартиру я смотрю сразу с двух сторон: как риелтор — на цену, застройщика и
              ликвидность, как дизайнер — на то, во что обойдётся привести её в жилой вид. Часто
              оказывается, что квартира на 300 тысяч дешевле требует на 700 тысяч больше ремонта. Про
              это — статья{" "}
              <Link href="/blog/chistovaya-predchistovaya-i-chernovaya-otdelka-v-chem-raznitsa">
                про виды отделки
              </Link>
              .
            </p>
          </div>

          <div className={styles.block}>
            <h2>Как я работаю с деньгами клиента</h2>
            <p>
              Моя комиссия приходит от застройщика, поэтому для вас подбор и сопровождение сделки
              бесплатны — и поэтому же я не заинтересована продать вам что подороже: на цену квартиры
              вознаграждение не завязано.
            </p>
            <p>
              Заявки на ипотеку веду параллельно в несколько банков и выбираю лучшее одобрение:
              скоринг у всех разный, и отказ в одном месте не означает отказ по программе.
              Считаю не рекламную ставку, а полную стоимость кредита — разрыв между ними на рыночных
              программах доходит до восьми процентных пунктов. Что это значит на цифрах, разобрано в
              статье{" "}
              <Link href="/blog/kakoy-protsent-po-ipoteke-v-ekaterinburge-seychas-stavki">
                про ставки по ипотеке
              </Link>
              .
            </p>
          </div>
        </div>

        <div className={styles.team}>
          <div className={styles.block}>
            <h2>Команда</h2>
          </div>
          <div className={styles.teamRow}>
            <span className={styles.teamName}>{MANAGER_NAME}</span>
            <span className={styles.teamRole}>
              менеджер — первый контакт, подбор объектов и запись на просмотры
            </span>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2>Связаться напрямую</h2>
          <p>
            Позвоните или напишите в мессенджер — отвечаю лично. Если удобнее начать с задачи, а не с
            разговора, пройдите короткий квиз, и я подготовлю подборку заранее.
          </p>
          <div className={styles.contactLinks}>
            <a href={`tel:${PHONE_TEL}`} className="btn-prim">
              {PHONE_DISPLAY}
            </a>
            <a href={TELEGRAM_URL} className="btn-sec">
              Telegram {TELEGRAM_HANDLE}
            </a>
            <Link href="/quiz" className="btn-sec">
              Пройти квиз
            </Link>
            <Link href="/contacts" className="btn-sec">
              Все контакты
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
