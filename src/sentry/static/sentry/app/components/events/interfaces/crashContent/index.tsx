import React from 'react';
import styled from '@emotion/styled';

import {tn} from 'app/locale';
import space from 'app/styles/space';
import {ExceptionType, ExceptionValue, PlatformType} from 'app/types';

import Exception from './exception';
import Stacktrace from './stacktrace';

type ExceptionProps = React.ComponentProps<typeof Exception>;
type Props = Pick<
  ExceptionProps,
  'stackType' | 'stackView' | 'projectId' | 'event' | 'newestFirst'
> & {
  exception?: ExceptionType;
  stacktrace?: ExceptionValue['stacktrace'];
};

const CrashContent = ({
  event,
  stackView,
  stackType,
  newestFirst,
  projectId,
  exception,
  stacktrace,
}: Props) => {
  const platform = (event.platform ?? 'other') as PlatformType;
  const exceptionValues = exception?.values;

  return (
    <Wrapper>
      {!!exceptionValues?.length && (
        <div>
          <Title>{tn('Exception', 'Exceptions', exceptionValues.length)}</Title>
          <Exception
            stackType={stackType}
            stackView={stackView}
            projectId={projectId}
            newestFirst={newestFirst}
            event={event}
            platform={platform}
            values={exceptionValues}
          />
        </div>
      )}
      {!!exceptionValues?.length && stacktrace && <hr />}
      {stacktrace && (
        <div>
          <Title>{tn('Stacktrace', 'Stacktraces', stacktrace.frames?.length)}</Title>
          <Stacktrace
            stacktrace={stacktrace}
            stackView={stackView}
            newestFirst={newestFirst}
            event={event}
            platform={platform}
          />
        </div>
      )}
    </Wrapper>
  );
};

export default CrashContent;

const Wrapper = styled('div')`
  margin-top: ${space(3)};
`;

const Title = styled('h5')`
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.gray300};
`;
