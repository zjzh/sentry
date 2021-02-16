import {ExceptionType} from 'app/types';
import {Event} from 'app/types/event';
import {Thread} from 'app/types/events';

function getThreadException(
  event: Event,
  thread?: Thread
): Required<ExceptionType> | undefined {
  const exceptionEntry = event.entries.find(entry => entry.type === 'exception');

  if (!exceptionEntry) {
    return undefined;
  }

  const exceptionData = exceptionEntry.data as ExceptionType;
  const exceptionDataValues = exceptionData.values;

  if (!exceptionDataValues?.length || !thread) {
    return undefined;
  }

  for (const exc of exceptionDataValues) {
    if (exc.threadId === thread.id && exc.stacktrace) {
      return exceptionData as Required<ExceptionType>;
    }
  }

  if (thread.crashed) {
    const exceptionHasAtLeastOneStacktrace = !!exceptionDataValues.find(
      exceptionDataValue => exceptionDataValue.stacktrace
    );

    if (!!exceptionHasAtLeastOneStacktrace) {
      return exceptionData as Required<ExceptionType>;
    }
  }

  return undefined;
}

export default getThreadException;
