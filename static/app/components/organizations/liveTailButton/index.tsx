import * as React from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';

import Button from 'app/components/button';
import {IconPause, IconPlay} from 'app/icons';
import space from 'app/styles/space';

type Props = ReactRouter.WithRouterProps & {
  value: boolean;
  onToggle: (value: boolean) => void;
};

class LiveTailButton extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const {value, onToggle} = this.props;

    return (
      <StyledButton
        onClick={() => {
          onToggle(!value);
        }}
      >
        <ButtonLabel>{value ? 'Stop Tailing' : 'Start Tailing'}</ButtonLabel>
        {value ? <Pause size="xs" /> : <Play size="xs" />}
      </StyledButton>
    );
  }
}

const StyledButton = styled(Button)`
  border: none;
  color: ${p => p.theme.gray300};
  &: focus {
    color: ${p => p.theme.gray300};
  }
  &: hover {
    color: ${p => p.theme.black};
  }
  font-size: ${p => p.theme.fontSizeLarge};
  font-weight: normal;
`;
const ButtonLabel = styled('div')`
  margin-right: ${space(1)};
`;
const Play = styled(IconPlay)`
  color: ${p => p.theme.green300};
`;
const Pause = styled(IconPause)`
  color: ${p => p.theme.red300};
`;

export default ReactRouter.withRouter(LiveTailButton);
