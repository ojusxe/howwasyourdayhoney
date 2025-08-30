import classNames from "classnames";
import s from "./Blockquote.module.css";

interface BlockquoteProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Blockquote({ className, children }: BlockquoteProps) {
  return (
    <blockquote className={classNames(s.blockquote, className)}>
      {children}
    </blockquote>
  );
}
