import * as React from 'react';
import styled from '@emotion/styled';

import Button from 'app/components/button';
import TextOverflow from 'app/components/textOverflow';
import {IconClose, IconEdit} from 'app/icons';
import {t} from 'app/locale';
import space from 'app/styles/space';

type Props = {
  features: string[];
  onHide?: () => void;
  className?: string;
};

function Describer({className, features, onHide}: Props) {
  const featuresString = features.join(', ');
  return (
    <div className={className}>
      <MainSection>
        <FeaturesList>{featuresString}</FeaturesList>

        <Button
          size="xsmall"
          priority="default"
          type="button"
          label={t('Change')}
          icon={<IconEdit />}
        />
      </MainSection>
      <Section>
        <Button
          onClick={onHide}
          priority="link"
          size="zero"
          icon={<IconClose size="xs" />}
        />
      </Section>
    </div>
  );
}

const Section = styled('div')`
  display: flex;
  align-items: center;
`;
const MainSection = styled(Section)`
  flex: 1;
  overflow: hidden;
`;
const FeaturesList = styled(TextOverflow)`
  font-family: ${p => p.theme.text.familyMono};
  margin-right: ${space(1)};
  cursor: pointer;
`;
const Label = styled('span')`
  font-weight: bold;
  text-transform: uppercase;

  &::after {
    content: ':';
    margin-right: ${space(0.5)};
  }
`;

const StyledDescriber = styled(Describer)`
  color: ${p => p.theme.black};
  padding: ${space(0.5)} ${space(1)};
  position: absolute;
  bottom: 100%;
  left: -8px;
  right: -8px;
  background-color: ${p => p.theme.yellow300};
  opacity: 0.85;
  z-index: 10000;
  font-size: ${p => p.theme.fontSizeSmall};
  display: flex;
  align-items: center;
`;

export default StyledDescriber;
