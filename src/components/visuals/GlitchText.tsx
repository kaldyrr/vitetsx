import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Props = {
  text: string;
  className?: string;
};

export const GlitchText = ({ text, className = '' }: Props) => {
  const reduced = usePrefersReducedMotion();

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      {!reduced ? (
        <>
          <span aria-hidden className="glitch-layer glitch-1">{text}</span>
          <span aria-hidden className="glitch-layer glitch-2">{text}</span>
        </>
      ) : null}
    </span>
  );
};
