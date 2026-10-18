import styled from "styled-components";

export const MainWrapper = styled.div`
  .signup-container {
    padding: 1.5rem;
    max-width: 450px;
    margin: 1.5rem auto;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    will-change: transform;
    -webkit-tap-highlight-color: transparent;
  }

  h1 {
    font-weight: 800;
    font-size: 2.0rem;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    background: linear-gradient(45deg, #e67329, #ff944d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
    text-align: center;
  }

  .Image-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .ant-form-item {
    margin-bottom: 0.8rem !important;
  }

  /* Desktop-specific styles */
  @media (hover: hover) and (pointer: fine) {
    .btn.btn-primary {
      transition: all 0.3s ease !important;
    }

    .btn.btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(75, 204, 163, 0.2) !important;
    }
  }

  /* Base button styling */
  .btn.btn-primary {
    background: linear-gradient(45deg, #e67329, #ff8f4d) !important;
    border: none !important;
    height: 40px !important;
    width: 100% !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    border-radius: 10px !important;
    margin-top: 0.8rem !important;
    margin-bottom: 0.5rem !important;
  }

  /* Mobile and touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .signup-container {
      margin: 1rem auto;
      transition: none !important;
      backdrop-filter: none;
      background: rgba(255, 255, 255, 0.15);
    }

    .btn.btn-primary {
      transition: none !important;
      transform: none !important;
      -webkit-tap-highlight-color: transparent;
    }

    .btn.btn-primary:active {
      background: #e67329 !important;
      transform: none !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
  }

  /* iOS specific fixes */
  @supports (-webkit-touch-callout: none) {
    .signup-container {
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-perspective: 1000;
      perspective: 1000;
    }

    .ant-form-item,
    .ant-input,
    .btn.btn-primary {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    .ant-form {
      -webkit-overflow-scrolling: touch;
    }
  }

  /* Small screen specific adjustments */
  @media (max-width: 380px) {
    .signup-container {
      margin: 0.5rem;
      padding: 1rem;
      border-radius: 12px;
    }

    h1 {
      font-size: 1.3rem;
      margin-bottom: 1rem;
    }
  }

  /* Input styling */
  .ant-input[disabled] {
    color: white !important;
    opacity: 0.8;
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    -webkit-tap-highlight-color: transparent;
  }

  .ant-input[disabled]:hover {
    border-color: rgba(255, 255, 255, 0.2) !important;
  }
`;
