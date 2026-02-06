import clsx from "clsx";
import type { HeroProps } from "./types";

export const Hero = ({
  children,
  image,
  overlay = false,
  asForm = false,
  className,
}: HeroProps) => {
  const Wrapper = asForm ? "form" : "div";

  return (
    <div
      className={clsx("hero min-h-screen", className)}
      style={{
        backgroundImage: `url(${image})`,
      }}
    >
      {overlay && <div className="hero-overlay bg-opacity-60" />}
      <Wrapper className="hero-content flex-col lg:flex-row gap-8">
        {children}
      </Wrapper>
    </div>
  );
};
