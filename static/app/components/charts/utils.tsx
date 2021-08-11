import {EChartOption} from 'echarts';
import {Location} from 'history';
import moment from 'moment';

import {DEFAULT_STATS_PERIOD} from 'app/constants';
import {EventsStats, GlobalSelection, MultiSeriesEventsStats} from 'app/types';
import {defined, escape} from 'app/utils';
import {parsePeriodToHours} from 'app/utils/dates';
import {decodeList} from 'app/utils/queryString';

const DEFAULT_TRUNCATE_LENGTH = 80;

// In minutes
export const SIXTY_DAYS = 86400;
export const THIRTY_DAYS = 43200;
export const TWO_WEEKS = 20160;
export const ONE_WEEK = 10080;
export const TWENTY_FOUR_HOURS = 1440;
export const ONE_HOUR = 60;
export const THIRTY_MINUTES = 30;
export const FIFTEEN_MINUTES = 15;
export const FIVE_MINUTES = 5;

/**
 * If there are more releases than this number we hide "Releases" series by default
 */
export const RELEASE_LINES_THRESHOLD = 50;

export type DateTimeObject = Partial<GlobalSelection['datetime']>;

export type Interval =
  | '4h'
  | '1d'
  | '2d'
  | '1h'
  | '30m'
  | '12h'
  | '6h'
  | '5m'
  | '15m'
  | '2m'
  | '1m'
  | '10m'
  | '30s'
  | '5s';

export function truncationFormatter(
  value: string,
  truncate: number | boolean | undefined
): string {
  if (!truncate) {
    return escape(value);
  }
  const truncationLength =
    truncate && typeof truncate === 'number' ? truncate : DEFAULT_TRUNCATE_LENGTH;
  const truncated =
    value.length > truncationLength ? value.substring(0, truncationLength) + '…' : value;
  return escape(truncated);
}

/**
 * Use a shorter interval if the time difference is <= 24 hours.
 */
export function useShortInterval(datetimeObj: DateTimeObject): boolean {
  const diffInMinutes = getDiffInMinutes(datetimeObj);

  return diffInMinutes <= TWENTY_FOUR_HOURS;
}

type Fidelity = 'high' | 'medium' | 'low';

export function getInterval(
  datetimeObj: DateTimeObject,
  fidelity: Fidelity = 'medium'
): Interval {
  const diffInMinutes = getDiffInMinutes(datetimeObj);

  if (diffInMinutes >= SIXTY_DAYS) {
    // Greater than or equal to 60 days
    if (fidelity === 'high') {
      return '4h';
    } else if (fidelity === 'medium') {
      return '1d';
    }
    return '2d';
  }

  if (diffInMinutes >= THIRTY_DAYS) {
    // Greater than or equal to 30 days
    if (fidelity === 'high') {
      return '1h';
    } else if (fidelity === 'medium') {
      return '4h';
    }
    return '1d';
  }

  if (diffInMinutes >= TWO_WEEKS) {
    if (fidelity === 'high') {
      return '30m';
    } else if (fidelity === 'medium') {
      return '1h';
    }
    return '12h';
  }

  if (diffInMinutes > TWENTY_FOUR_HOURS) {
    // Greater than 24 hours
    if (fidelity === 'high') {
      return '30m';
    } else if (fidelity === 'medium') {
      return '1h';
    }
    return '6h';
  }

  if (diffInMinutes > ONE_HOUR) {
    // Between 1 hour and 24 hours
    if (fidelity === 'high') {
      return '5m';
    } else if (fidelity === 'medium') {
      return '15m';
    } else {
      return '1h';
    }
  }

  if (diffInMinutes > THIRTY_MINUTES) {
    // Between 30 mins and 1 hour
    if (fidelity === 'high') {
      return '2m';
    } else if (fidelity === 'medium') {
      return '5m';
    } else {
      return '30m';
    }
  }

  if (diffInMinutes > FIFTEEN_MINUTES) {
    // Between 15 mins and 30 mins
    if (fidelity === 'high') {
      return '1m';
    } else if (fidelity === 'medium') {
      return '2m';
    } else {
      return '10m';
    }
  }

  if (diffInMinutes > FIVE_MINUTES) {
    // Between 15 mins and 30 mins
    if (fidelity === 'high') {
      return '30s';
    } else if (fidelity === 'medium') {
      return '1m';
    } else {
      return '5m';
    }
  }

  // Less than or equal to 15 mins
  if (fidelity === 'high') {
    return '5s';
  } else if (fidelity === 'medium') {
    return '30s';
  } else {
    return '1m';
  }
}

/**
 * Duplicate of getInterval, except that we do not support <1h granularity
 * Used by SessionsV2 and OrgStatsV2 API
 */
export function getSeriesApiInterval(datetimeObj: DateTimeObject) {
  const diffInMinutes = getDiffInMinutes(datetimeObj);

  if (diffInMinutes >= SIXTY_DAYS) {
    // Greater than or equal to 60 days
    return '1d';
  }

  if (diffInMinutes >= THIRTY_DAYS) {
    // Greater than or equal to 30 days
    return '4h';
  }

  return '1h';
}

export function getDiffInMinutes(datetimeObj: DateTimeObject): number {
  const {period, start, end} = datetimeObj;

  if (start && end) {
    return moment(end).diff(start, 'minutes');
  }

  return (
    parsePeriodToHours(typeof period === 'string' ? period : DEFAULT_STATS_PERIOD) * 60
  );
}

// Max period (in hours) before we can no long include previous period
const MAX_PERIOD_HOURS_INCLUDE_PREVIOUS = 45 * 24;

export function canIncludePreviousPeriod(
  includePrevious: boolean | undefined,
  period: string | undefined
) {
  if (!includePrevious) {
    return false;
  }

  if (period && parsePeriodToHours(period) > MAX_PERIOD_HOURS_INCLUDE_PREVIOUS) {
    return false;
  }

  // otherwise true
  return !!includePrevious;
}

/**
 * Generates a series selection based on the query parameters defined by the location.
 */
export function getSeriesSelection(
  location: Location,
  parameter = 'unselectedSeries'
): EChartOption.Legend['selected'] {
  const unselectedSeries = decodeList(location?.query[parameter]);
  return unselectedSeries.reduce((selection, series) => {
    selection[series] = false;
    return selection;
  }, {});
}

export function isMultiSeriesStats(
  data: MultiSeriesEventsStats | EventsStats | null | undefined
): data is MultiSeriesEventsStats {
  return defined(data) && data.data === undefined && data.totals === undefined;
}

// If dimension is a number convert it to pixels, otherwise use dimension
// without transform
export const getDimensionValue = (dimension?: number | string | null) => {
  if (typeof dimension === 'number') {
    return `${dimension}px`;
  }

  if (dimension === null) {
    return undefined;
  }

  return dimension;
};

export const intervalToNumber = (interval: Interval) => {
  const [_, value, unit] = /^(\d+)(d|h|m|s)$/g.exec(interval) as RegExpExecArray;
  let multiplier = 1000;
  switch (unit) {
    case 'd':
      multiplier *= 60 * 60 * 24;
      break;
    case 'h':
      multiplier *= 60 * 60;
      break;
    case 'm':
      multiplier *= 60;
      break;
    default:
  }
  return parseInt(value, 10) * multiplier;
};
