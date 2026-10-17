import Image from "next/image";
import styles from "./article-lead-block.module.css";

/** Маленький портрет Яны в блоке заявки — кадр выбирает страница (lib/yana-photos). */
export function YanaAvatar({ photo }: { photo: string }) {
  return <Image src={photo} alt="Яна Чекулова" width={64} height={64} className={styles.avatar} />;
}
