import * as React from 'react';
import styled from '@emotion/styled';

import {Config} from 'app/types';
import withConfig from 'app/utils/withConfig';

import {useFeatureHighlighter} from './context';
import Describer from './describer';

type Props = {
  availableFeatures: {
    configFeatures: string[];
    organization: string[];
    project: string[];
  };
  children: React.ReactNode;
  config: Config;
  features: string[];
  className?: string;
};

function FeatureHighlighter({
  availableFeatures,
  className,
  children,
  config,
  features,
}: Props) {
  const highlighter = useFeatureHighlighter();
  if (!highlighter?.enabled) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  if (!config.user.isStaff) {
    // TODO: uncomment this
    // return children;
  }
  console.log({availableFeatures});

  return (
    <div className={className}>
      <Border position="bottom" />
      <Border position="left" />
      <Border position="right" />
      <Describer features={features} />
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
  z-index: 10000;
`;
const InnerHighlight = styled('div')``;
const StyledFeatureHighlighter = styled(FeatureHighlighter)`
  position: relative;

  &:hover {
    ${Border}, ${Describer} {
      opacity: 1;
      z-index: 20000;
    }
  }
`;

export default withConfig(StyledFeatureHighlighter);
