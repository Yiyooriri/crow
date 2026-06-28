import { RESULT_COPY, ResultKey } from "./resultData";
import { playButtonSound } from "./soundEffects";

type ResultScreenV2Props = {
  name: string;
  result: ResultKey;
  onRetry: () => void;
};

function splitKorean(text: string) {
  const sentences = text.match(/[^.]+[.]/g) ?? [text];
  return {
    lead: sentences[0]?.trim() ?? text,
    rest: sentences.slice(1).join(" ").trim(),
  };
}

export default function ResultScreenV2({ name, result, onRetry }: ResultScreenV2Props) {
  const copy = RESULT_COPY[result];
  const korean = splitKorean(copy.kr(name));
  const retry = () => {
    playButtonSound();
    onRetry();
  };

  return (
    <section className="crow-v2-result-screen">
      <img className="crow-v2-result-heading" src="/assets/result.png" alt="RESULT" />

      <img
        className="crow-v2-result-oracle"
        src={`/assets/${result}.png`}
        alt={`${result} ${copy.koreanName}`}
      />

      <div className={`crow-v2-result-title ${result === "MISFORTUNE" ? "is-long" : ""}`}>
        <img src="/assets/Deco01.png" alt="" aria-hidden="true" />
        <h1>{result}</h1>
        <img src="/assets/Deco01.png" alt="" aria-hidden="true" />
      </div>

      <p className="crow-v2-result-korean-name">{copy.koreanName}</p>
      <img className="crow-v2-result-divider" src="/assets/Deco02.png" alt="" aria-hidden="true" />

      <div className="crow-v2-result-copy">
        <p className="crow-v2-result-lead">{korean.lead}</p>
        <img src="/assets/Deco03.png" alt="" aria-hidden="true" />
        {korean.rest && <p className="crow-v2-result-rest">{korean.rest}</p>}
        <p className="crow-v2-result-en">{copy.en(name)}</p>
      </div>

      <div className="crow-v2-result-retry">
        <img src="/assets/button.png" alt="" aria-hidden="true" />
        <button onClick={retry}>TRY ANOTHER</button>
      </div>
    </section>
  );
}
