import {RawStacktrace, StacktraceType} from './stacktrace';

export interface Thread {
  id: number;
  crashed: boolean;
  rawStacktrace: RawStacktrace | null;
  stacktrace: StacktraceType | null;
  current?: boolean;
  name?: string;
}
