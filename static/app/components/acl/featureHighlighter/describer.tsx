import * as React from 'react';
import styled from '@emotion/styled';

import Button from 'app/components/button';
import {IconEdit} from 'app/icons';
import {t} from 'app/locale';

type Props = {
  features: string[];
  className?: string;
};

function Describer({className, features}: Props) {
  return (
    <div className={className}>
      <Label>{t('Features')}</Label>
      {features.join(', ')}
      <Button
        size="xsmall"
        priority="default"
        type="button"
        label={t('Change')}
        icon={<IconEdit />}
      />
    </div>
  );
}

const Label = styled('span')`
  font-weight: bold;
  text-transform: uppercase;

  &::after {
    content: ':';
    margin-right: 4px;
  }
`;

const StyledDescriber = styled(Describer)`
  color: ${p => p.theme.black};
  padding: 4px 8px;
  position: absolute;
  bottom: 100%;
  left: -8px;
  right: -8px;
  background-color: ${p => p.theme.yellow300};
  opacity: 0.85;
  z-index: 10000;
`;

export default StyledDescriber;
