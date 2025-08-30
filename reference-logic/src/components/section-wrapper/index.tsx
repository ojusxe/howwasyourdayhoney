import classNames from "classnames";
import GridContainer from "../grid-container";
import s from "./SectionWrapper.module.css";

interface SectionWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

export default function SectionWrapper({
  children,
  className,
}: SectionWrapperProps) {
  return (
    <section className={classNames(s.sectionWrapper, className)}>
      <GridContainer>{children}</GridContainer>
    </section>
  );
}
