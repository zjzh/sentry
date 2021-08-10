import * as React from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';

import Button from 'app/components/button';
import {IconPause, IconPlay} from 'app/icons';

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
        {value ? <IconPause size="xs" /> : <IconPlay size="xs" />}
      </StyledButton>
    );
  }
}

const StyledButton = styled(Button)`
  border: none;
  color: ${p => p.theme.gray300};
`;

export default ReactRouter.withRouter(LiveTailButton);
