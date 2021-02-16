import {ExceptionType} from 'app/types';
import {Event} from 'app/types/event';
import {Thread} from 'app/types/events';

import getThreadException from './getThreadException';

function getThreadStacktrace(
  event: Event,
  raw: boolean,
  thread?: Thread,
  exception?: Required<ExceptionType>
) {
  if (!thread) {
    return undefined;
  }

  const threadException = exception ?? getThreadException(event, thread);

  if (threadException) {
    const threadExceptionValues = threadException.values;

    const matchedStacktraceAndExceptionThread = threadExceptionValues.find(
      threadExceptionValue => threadExceptionValue.threadId === thread.id
    );

    if (matchedStacktraceAndExceptionThread) {
      if (raw && matchedStacktraceAndExceptionThread.rawStacktrace) {
        return matchedStacktraceAndExceptionThread.rawStacktrace;
      }

      return matchedStacktraceAndExceptionThread.stacktrace;
    }
  }

  if (raw && thread.rawStacktrace) {
    return thread.rawStacktrace;
  }

  if (thread.stacktrace) {
    return thread.stacktrace;
  }

  return undefined;
}

export default getThreadStacktrace;
