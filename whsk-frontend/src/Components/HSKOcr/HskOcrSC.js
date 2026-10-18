import styled from "styled-components";

export const MainWrapper = styled.div`
  padding: clamp(0.5rem, 2vw, 1.5rem);
  max-width: 1200px;
  margin: 0 auto;
  background-color: --darkerOrange;
  min-height: 100vh;

  .divider {
    display: flex;
    gap: clamp(1rem, 2vw, 2rem);
    justify-content: space-between;
    align-items: flex-start;
    margin: 0 auto;
    max-width: 1100px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .webcam-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: --darkerOrange;
    padding: clamp(0.5rem, 2vw, 1.5rem);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;

    .react-webcam {
      width: 100% !important;
      max-width: 100%;
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: clamp(0.5rem, 2vw, 1rem);

      @media (max-width: 768px) {
        aspect-ratio: 3/4;
      }
    }
  }

  .result-container {
    flex: 1;
    min-height: clamp(300px, 50vh, 400px);
    background: #8b939c;
    padding: clamp(0.5rem, 2vw, 1.5rem);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;

    img {
      width: 100%;
      max-width: 100%;
      height: auto;
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: 8px;
      margin: clamp(0.5rem, 2vw, 1rem) 0;

      @media (max-width: 768px) {
        aspect-ratio: 3/4;
      }
    }

    .ui.header {
      margin: clamp(0.5rem, 2vw, 1rem) 0;
      font-size: clamp(1rem, 3vw, 1.5rem);
      text-align: center;
    }

    .ui.message {
      margin: clamp(0.5rem, 2vw, 1rem) 0;
      padding: clamp(0.5rem, 2vw, 0.8rem);
      font-size: clamp(0.9rem, 2vw, 1rem);
    }
  }

  .button-group {
    display: flex;
    gap: clamp(1rem, 2vw, 2rem);
    margin-top: clamp(0.5rem, 2vw, 1rem);
    justify-content: center;
    width: 100%;
    padding: 0 clamp(0.3rem, 1vw, 0.5rem);

    button {
      padding: 18px 35px;
      font-size: 1.2rem !important;
      font-weight: 600;
      background-color: rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(5px);
      border: none !important;
      color: white !important;
      box-shadow: 0 4px 8px rgba(244, 123, 63, 0.3);
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3) !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      }

      @media (max-width: 768px) {
        width: 140px;
        height: 50px;
        padding: 15px 25px;
        font-size: 1rem !important;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      padding: 1rem;
    }
  }

  .ui.loader {
    margin: clamp(1rem, 4vw, 2rem) auto !important;
  }

  /* Additional Mobile Optimizations */
  @media (max-width: 480px) {
    .webcam-container,
    .result-container {
      padding: 0.5rem;
    }

    .result-container {
      min-height: 250px;
    }

    // .button-group {
    //   button {
    //     padding: 0.6rem;
    //   }
    // }
  }

  /* Mobile Optimizations */
  @media (max-width: 768px) {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;

    .divider {
      flex-direction: column;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      max-width: none;
    }

    .webcam-container {
      width: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: none;

      .react-webcam {
        width: 100% !important;
        height: auto !important;
        min-height: 550px;
        object-fit: cover;
        margin: 0;
      }
    }

    .result-container {
      width: 100%;
      margin: 1rem 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: none;

      img {
        width: 100%;
        height: auto;
        min-height: 550px;
        object-fit: cover;
        margin: 0;
      }
    }

    .button-group {
      width: 100%;
      padding: 1rem 0;
      gap: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      
      button {
        width: 140px;
        height: 50px;
      }
    }
  }

  /* Small Mobile */
  @media (max-width: 480px) {
    .webcam-container,
    .result-container {
      width: 100%;
      
      .react-webcam, img {
        min-height: 500px;
      }
    }
  }
`;