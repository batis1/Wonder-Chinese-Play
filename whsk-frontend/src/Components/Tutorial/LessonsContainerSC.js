import styled, { keyframes } from 'styled-components';

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-60px);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1) translateY(0);
  }
  80% {
    opacity: 1;
    transform: scale(0.89);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

export const AnimatedLessonWrapper = styled.div`
  opacity: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  will-change: transform, opacity;
  animation: ${bounceIn} 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  animation-delay: ${props => props.index * 0.2}s;
  position: relative;
  z-index: ${props => props.isActive ? 3000 - props.index : (10 - props.index)};

  /* The circular lesson icon */
  .lesson-item {
    transform-origin: center center;
    position: relative;
    z-index: ${props => props.isActive ? 3001 - props.index : (11 - props.index)};
  }

  /* The popup styling */
.lesson-popup {
    position: absolute;
    z-index: ${props => props.isActive ? 3002 - props.index : 0};
    left: 50%;
    transform: translateX(-50%);
    display: ${props => props.isActive ? 'block' : 'none'}; // Only show when active
  }

//   &:hover {
//     z-index: ${props => props.isActive ? 3000 - props.index : (100 - props.index)};
//   }

  .lessons-row-container {
    position: relative;
  }

  /* Ensure the animation plays even if the component remounts */
  &:nth-child(1) { animation-delay: 0.2s; }
  &:nth-child(2) { animation-delay: 0.4s; }
  &:nth-child(3) { animation-delay: 0.6s; }
`;