import React, { useRef, useLayoutEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import "./Home.css";
import "./HomeRefresh.css";
import { ButtonOptions } from "../ButtonOptions/ButtonOptions";
import { faGraduationCap, faGamepad, faTrophy, faBook, faChartLine, faLanguage, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import FontIcon from "./FontIcon";
import { preloadRoute } from "../../lib/routePreload";

const featureIcons = { "graduation-cap": faGraduationCap, gamepad: faGamepad, trophy: faTrophy, book: faBook, "chart-line": faChartLine, language: faLanguage };

const features = [
  { icon: "graduation-cap", title: "Interactive Learning", text: "Practice reading, listening, and writing, one lesson at a time.", tone: "mint" },
  { icon: "gamepad", title: "Game Mode", text: "Beat the clock. Get bonus points and extra time for every correct answer.", tone: "peach" },
  { icon: "trophy", title: "Global Scoreboard", text: "Bring a little friendly competition to your Chinese learning.", tone: "yellow" },
  { icon: "book", title: "Comprehensive Learning", text: "Understand the answer with explanations and translations along the way.", tone: "lavender" },
  { icon: "chart-line", title: "Track Progress", text: "See how far you have come, and keep your next milestone in sight.", tone: "blue" },
  { icon: "language", title: "HSK 5 Vocabulary", text: "Build your Chinese vocabulary alongside the HSK 5 Standard Course.", tone: "pink" },
];

const Home = ({ user }) => {
  const history = useHistory();
  const featuresRef = useRef(null);
  const [answer, setAnswer] = useState(null);

  useLayoutEffect(() => {
    document.body.classList.add("whsk-home-active");
    return () => document.body.classList.remove("whsk-home-active");
  }, []);

  const scrollToFeatures = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    featuresRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <main className="Home whsk-home">
      <section className="whsk-hero" aria-labelledby="whsk-title">
        <div className="whsk-hero-copy hometitle-container">
          <h1 id="whsk-title">WHSK<span>Play your way to Chinese.</span></h1>
          <p className="whsk-hero-description">Small lessons. Lively challenges. Real progress.<br />Find your rhythm with Chinese, one word at a time.</p>
          <div className="home-buttonsContainer whsk-hero-actions">
            {user ? <ButtonOptions /> : (
              <button className="btn homebtn getstarted" onPointerEnter={() => preloadRoute('/login')} onFocus={() => preloadRoute('/login')} onClick={() => history.push("/login")}>
                Get started <FontIcon icon={faArrowRight} />
              </button>
            )}
          </div>
        </div>
        <svg className="whsk-hero-transition" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 40 C120 105 185 5 300 35 S465 100 600 30 S785 5 915 45 S1080 95 1190 35 S1350 20 1440 45 V100 H0 Z" />
        </svg>
      </section>

      <section className="whsk-feature-section" ref={featuresRef} aria-labelledby="whsk-features-title">
        <button className="scroll-arrow whsk-explore" onClick={scrollToFeatures} aria-label="Explore WHSK features"><span className="arrow" aria-hidden="true" /></button>
        <div className="whsk-section-heading">
          <div><h2 id="whsk-features-title">Make every word<br />a small win.</h2></div>
          <p>Some days, take it lesson by lesson.<br />Other days, race the clock.<br />There is more than one way to get there.</p>
        </div>
        <div className="whsk-feature-grid">
          {features.map(feature => (
            <article className={`whsk-feature whsk-tone-${feature.tone}`} key={feature.title}>
              <FontIcon icon={featureIcons[feature.icon]} />
              <h3>{feature.title}</h3><p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="whsk-warmup" aria-labelledby="whsk-warmup-title">
        <div className="whsk-warmup-inner">
          <div className="whsk-warmup-copy">
            <h2 id="whsk-warmup-title">Your first win?<br />It starts with hello.</h2>
            <p>A familiar word is a good place to begin.<br />Keep going with lessons, or turn up the pace in Game Mode.</p>
            <Link to={user ? "/tutorial" : "/login"} className="whsk-text-link">Find your next lesson <FontIcon icon={faArrowRight} /></Link>
          </div>
          <div className="whsk-word-practice">
            <span className="whsk-word-label">A quick warm-up</span>
            <span className="whsk-hanzi" lang="zh">你好</span><span className="whsk-pinyin">nǐ hǎo</span>
            <fieldset><legend>What does it mean?</legend>
              <div className="whsk-answer-options">
                {["Hello", "Thank you"].map(option => (
                  <button type="button" key={option} aria-pressed={answer === option} onClick={() => setAnswer(option)} className={answer === option ? "is-selected" : ""}>{option}</button>
                ))}
              </div>
            </fieldset>
            <p className="whsk-answer-feedback" role="status">{answer === "Hello" ? "That's right! Your first hello, sorted." : answer ? "Not quite. Try the other greeting." : ""}</p>
          </div>
        </div>
      </section>

      <section className="whsk-home-close" aria-label="Start learning">
        <Link to={user ? "/tutorial" : "/login"} className="whsk-close-link">Let&apos;s get learning <FontIcon icon={faArrowRight} /></Link>
      </section>
      <footer className="whsk-home-footer"><strong>WHSK</strong><span>A little practice goes a long way.</span><Link to="/leaderboard">Scoreboard <FontIcon icon={faArrowRight} /></Link></footer>
    </main>
  );
};

export default Home;
