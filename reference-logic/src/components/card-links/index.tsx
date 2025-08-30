import Link from "next/link";
import { H4, P } from "../text";
import s from "./CardLinks.module.css";

interface CardLink {
  title: string;
  description: string;
  href: string;
}

interface CardLinkProps {
  cards: CardLink[];
}

export default function CardLinks({ cards }: CardLinkProps) {
  return (
    <div className={s.cardLinks}>
      <ul>
        {cards.map((cardLink) => {
          return (
            <li key={cardLink.title + cardLink.href}>
              <Link href={cardLink.href} className={s.link}>
                <H4 className={s.title}>{cardLink.title}</H4>
                <P>{cardLink.description}</P>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
