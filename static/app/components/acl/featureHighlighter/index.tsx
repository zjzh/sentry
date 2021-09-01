import * as React from 'react';
import styled from '@emotion/styled';

import {useFeatureHighlighter} from './context';
import Describer from './describer';
import {AvailableFeatures} from './types';

type Props = {
  children: React.ReactNode;
  isVisible: boolean;
  features: string[];
  className?: string;
};

function FeatureHighlighter({
  className,
  children,
  features,
  isVisible,
}: Props) {
  const highlighter = useFeatureHighlighter();
  const [isSelfVisible, setSelfVisible] = React.useState(true);

  function handleHide() {
    setSelfVisible(false);
  }

  if (!highlighter?.enabled || !isVisible || !isSelfVisible) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <div className={className}>
      <Border position="bottom" />
      <Border position="left" />
      <Border position="right" />
      <Describer onHide={handleHide} features={features} />
      <InnerHighlight>{children}</InnerHighlight>
    </div>
  );
}

type BorderProps = {
  position: 'left' | 'right' | 'top' | 'bottom';
};

function getBorder({position}: BorderProps) {
  const BORDER_SIZE = '8px';

  if (position === 'top') {
    return `
      top: -${BORDER_SIZE};
      bottom: 100%;
      left: -${BORDER_SIZE};
      right: -${BORDER_SIZE};
    `;
  }
  if (position === 'right') {
    return `
      top: 0;
      bottom: 0;
      left: 100%;
      right: -${BORDER_SIZE};
    `;
  }
  if (position === 'left') {
    return `
      top: 0;
      bottom: 0;
      left: -${BORDER_SIZE};
      right: 100%;
    `;
  }

  // else bottom

  return `
      bottom: -${BORDER_SIZE};
      top: 100%;
      left: -${BORDER_SIZE};
      right: -${BORDER_SIZE};
    `;
}
const Border = styled(`div`)<BorderProps>`
  position: absolute;
  ${getBorder}
  background-color: ${p => p.theme.yellow300};
  opacity: 0.85;
  z-index: ${p => p.theme.zIndex.modal - 2};
`;
const InnerHighlight = styled('div')``;

const StyledFeatureHighlighter = styled(FeatureHighlighter)<Props>`
  position: relative;

  &:hover {
    ${Border}, ${Describer} {
      opacity: 1;
      z-index: ${p => p.theme.zIndex.modal - 1};
    }
  }
`;

export default StyledFeatureHighlighter;
