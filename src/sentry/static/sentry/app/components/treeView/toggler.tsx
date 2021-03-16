import React from 'react';
import styled from '@emotion/styled';

import {IconChevron} from 'app/icons';
import space from 'app/styles/space';

type Props = {
  onToggle: () => void;
  isToggled: boolean;
};

function Toggler({onToggle, isToggled}: Props) {
  return (
    <Wrapper>
      <IconChevron
        onClick={onToggle}
        size="10px"
        direction={isToggled ? 'down' : 'right'}
      />
    </Wrapper>
  );
}

export default Toggler;

const Wrapper = styled('div')`
  margin-right: ${space(0.5)};
  color: ${p => p.theme.purple300};
  cursor: pointer;
`;
