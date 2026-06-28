import { FormEvent, useCallback, useState } from "react";
import MouseWarpBackground from "./MouseWarpBackground";
import PinballBoardV2 from "./PinballBoardV2";
import ResultScreenV2 from "./ResultScreenV2";
import FeatherCursor from "./FeatherCursor";
import { ResultKey } from "./resultData";
import { playButtonSound } from "./soundEffects";
import "./CrowLandingV2.css";

type Screen = "main" | "pinball" | "result";

function AssetFrame({ screen }: { screen: Screen }) {
  return (
    <img
      className="crow-asset-frame"
      src={screen === "pinball" ? "/assets/frame_pinball.png" : "/assets/frame.png"}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function CrowLandingV2() {
  const [screen, setScreen] = useState<Screen>("main");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [luckName, setLuckName] = useState("");
  const [taggedName, setTaggedName] = useState("");
  const [result, setResult] = useState<ResultKey>("LUCK");

  const showResult = useCallback((nextResult: ResultKey) => {
    setResult(nextResult);
    setScreen("result");
  }, []);

  const restart = useCallback(() => {
    setLuckName("");
    setTaggedName("");
    setResult("LUCK");
    setIsPopupOpen(false);
    setScreen("main");
  }, []);

  const proceed = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = luckName.trim();
    if (!trimmed) return;
    playButtonSound();
    setTaggedName(trimmed);
    setIsPopupOpen(false);
    setScreen("pinball");
  };

  const openPopup = () => {
    playButtonSound();
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    playButtonSound();
    setIsPopupOpen(false);
  };

  return (
    <main className="crow-v2-root">
      <FeatherCursor />
      <div className={`crow-v2-screen ${isPopupOpen ? "has-popup" : ""}`}>
        <div className="crow-v2-atmosphere" aria-hidden="true">
          <div className="crow-v2-grain" />
          <div className="crow-v2-light" />
        </div>
        <AssetFrame screen={screen} />

        {screen === "main" ? (
          <section className="crow-v2-main">
            <img className="crow-v2-symbol" src="/assets/simbol.png" alt="" />
            <p className="crow-v2-pre">i-dle pre-release track</p>
            <h1 className="crow-v2-logo">
              <img src="/assets/crow.png" alt="CROW" />
            </h1>
            <MouseWarpBackground />
            <img
              className="crow-v2-main-visual"
              src="/assets/crow-main-visual.png"
              alt="푸른 안개 속을 나는 까마귀"
            />
            <div className="crow-v2-crow-wrap">
              <div className="crow-v2-ring crow-v2-ring--one" />
            </div>
            <div className="crow-v2-tag-button-wrap">
              <img src="/assets/button.png" alt="" aria-hidden="true" />
              <button onClick={openPopup}>TAG YOUR LUCK</button>
            </div>
            <a
              className="crow-v2-playlist"
              href="https://youtu.be/bUMLC9lCgHo?si=BvT3CZhHvz83S6cu"
              target="_blank"
              rel="noreferrer"
            >
              MUSIC VIDEO ↗
            </a>
          </section>
        ) : screen === "pinball" ? (
          <PinballBoardV2 tag={taggedName} onComplete={showResult} />
        ) : (
          <ResultScreenV2 name={taggedName} result={result} onRetry={restart} />
        )}

        {isPopupOpen && (
          <div className="crow-v2-modal-layer" role="presentation">
            <section className="crow-v2-modal" role="dialog" aria-modal="true" aria-labelledby="crow-v2-dialog-title">
              <img className="crow-v2-modal-art" src="/assets/input.png" alt="" aria-hidden="true" />
              <button className="crow-v2-close" aria-label="닫기" onClick={closePopup}>×</button>
              <p>✦ &nbsp; TAG YOUR LUCK &nbsp; ✦</p>
              <h2 id="crow-v2-dialog-title">알고 싶은 운의 이름을 적어주세요</h2>
              <form onSubmit={proceed}>
                <label>
                  <span>✦</span>
                  <input
                    autoFocus
                    value={luckName}
                    onChange={(event) => setLuckName(event.target.value)}
                    placeholder="운의 이름을 입력하세요"
                    maxLength={18}
                  />
                  <span>✦</span>
                </label>
                <button disabled={!luckName.trim()} type="submit">✦ &nbsp; NEXT &nbsp; ✦</button>
              </form>
            </section>
          </div>
        )}

      </div>
    </main>
  );
}
