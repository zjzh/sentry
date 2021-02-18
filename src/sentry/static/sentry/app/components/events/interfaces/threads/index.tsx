import React from 'react';

import EventDataSection from 'app/components/events/eventDataSection';
import CrashActions from 'app/components/events/interfaces/crashHeader/crashActions';
import CrashTitle from 'app/components/events/interfaces/crashHeader/crashTitle';
import {isStacktraceNewestFirst} from 'app/components/events/interfaces/stacktrace';
import {t} from 'app/locale';
import {ExceptionType, Project} from 'app/types';
import {Event} from 'app/types/event';
import {Thread} from 'app/types/events';
import {STACK_TYPE, STACK_VIEW, StacktraceType} from 'app/types/stacktrace';
import {defined} from 'app/utils';

import findBestThread from './threadSelector/findBestThread';
import getThreadException from './threadSelector/getThreadException';
import getThreadStacktrace from './threadSelector/getThreadStacktrace';
import Content from './content';
import ThreadSelector from './threadSelector';

const defaultProps = {
  hideGuide: false,
};

type Props = {
  event: Event;
  projectId: Project['id'];
  type: string;
  data: {
    values?: Array<Thread>;
  };
} & typeof defaultProps;

type State = {
  stackType: STACK_TYPE;
  newestFirst: boolean;
  activeThread?: Thread;
  stackView?: STACK_VIEW;
};

function getIntendedStackView(thread: Thread, event: Event) {
  const exception = getThreadException(event, thread);
  const stacktrace = getThreadStacktrace(event, false, thread, exception);
  return (stacktrace ?? exception)?.hasSystemFrames ? STACK_VIEW.APP : STACK_VIEW.FULL;
}

class Threads extends React.Component<Props, State> {
  static defaultProps = defaultProps;

  state: State = this.getInitialState();

  getInitialState(): State {
    const {data, event} = this.props;
    const thread = defined(data.values) ? findBestThread(data.values) : undefined;
    return {
      activeThread: thread,
      stackView: thread ? getIntendedStackView(thread, event) : undefined,
      stackType: STACK_TYPE.ORIGINAL,
      newestFirst: isStacktraceNewestFirst(),
    };
  }

  handleSelectNewThread = (thread: Thread) => {
    this.setState(prevState => ({
      activeThread: thread,
      stackView:
        prevState.stackView !== STACK_VIEW.RAW
          ? getIntendedStackView(thread, this.props.event)
          : prevState.stackView,
      stackType: STACK_TYPE.ORIGINAL,
    }));
  };

  handleChangeNewestFirst = ({newestFirst}: Pick<State, 'newestFirst'>) => {
    this.setState({newestFirst});
  };

  handleChangeStackView = ({
    stackView,
    stackType,
  }: Partial<Pick<State, 'stackType' | 'stackView'>>) => {
    this.setState(prevState => ({
      stackView: stackView ?? prevState.stackView,
      stackType: stackType ?? prevState.stackType,
    }));
  };

  renderTitle(
    threads: Array<Thread>,
    exception?: Required<ExceptionType>,
    stacktrace?: StacktraceType
  ) {
    const {newestFirst, activeThread} = this.state;
    const {hideGuide, event} = this.props;

    if (exception && !stacktrace) {
      const exceptionValues = exception.values.map((value, index) => ({
        id: index,
        crashed: true,
        rawStacktrace: value.rawStacktrace,
        stacktrace: value.stacktrace,
      }));

      return (
        <CrashTitle
          title=""
          newestFirst={newestFirst}
          hideGuide={hideGuide}
          onChange={this.handleChangeNewestFirst}
          beforeTitle={
            !!exceptionValues.length && (
              <ThreadSelector
                threads={exceptionValues}
                activeThread={exceptionValues[0]}
                event={event}
                onChange={this.handleSelectNewThread}
              />
            )
          }
        />
      );
    }

    if (threads.length > 1) {
      return (
        <CrashTitle
          title=""
          newestFirst={newestFirst}
          hideGuide={hideGuide}
          onChange={this.handleChangeNewestFirst}
          beforeTitle={
            activeThread && (
              <ThreadSelector
                threads={threads}
                activeThread={activeThread}
                event={event}
                onChange={this.handleSelectNewThread}
              />
            )
          }
        />
      );
    }

    return (
      <CrashTitle
        title={t('Stack Trace')}
        newestFirst={newestFirst}
        hideGuide={hideGuide}
        onChange={this.handleChangeNewestFirst}
      />
    );
  }

  render() {
    const {data, event, projectId, type} = this.props;

    if (!data.values) {
      return null;
    }

    const threads = data.values;
    const {stackView, stackType, newestFirst, activeThread} = this.state;

    const exception = getThreadException(event, activeThread);
    const stacktrace = getThreadStacktrace(
      event,
      stackType !== STACK_TYPE.ORIGINAL,
      activeThread,
      exception
    );

    const hasMissingStacktrace = !(exception || stacktrace);
    const hasMoreThanOneThread = threads.length > 1 || (exception && !stacktrace);

    return (
      <EventDataSection
        type={type}
        title={this.renderTitle(threads, exception, stacktrace)}
        actions={
          !hasMissingStacktrace && (
            <CrashActions
              stackView={stackView}
              platform={event.platform}
              stacktrace={stacktrace}
              stackType={stackType}
              thread={hasMoreThanOneThread ? activeThread : undefined}
              exception={exception}
              onChange={this.handleChangeStackView}
            />
          )
        }
        showPermalink={!hasMoreThanOneThread}
        wrapTitle={false}
      >
        <Content
          data={activeThread}
          exception={exception}
          stackView={stackView}
          stackType={stackType}
          stacktrace={stacktrace}
          event={event}
          newestFirst={newestFirst}
          projectId={projectId}
          hasMissingStacktrace={hasMissingStacktrace}
        />
      </EventDataSection>
    );
  }
}

export default Threads;
