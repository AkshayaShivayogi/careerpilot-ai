import { useEffect, useState } from "react";

export default function AiTypingText({ text = "", speed = 18, className = "", onComplete }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplay("");
      return undefined;
    }
    setDisplay("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, onComplete]);

  return (
    <p className={className}>
      {display}
      {display.length < text.length && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400 align-middle" />
      )}
    </p>
  );
}
