import {t} from 'app/locale';

export const visualizationColors = [{label: t('Default Color'), value: 'purple'}];

export const metricMockOptions = [
  'sentry.response',
  'sentry.events.failed',
  'sentry.events.processed',
  'sentry.events.processed.javascript',
  'sentry.events.processed.java',
  'sentry.events.processed.node',
  'symbolicator.healthcheck',
];

export const groupByMockOptions = [
  {label: t('Everything'), value: 'everything'},
  {label: t('Status'), value: 'status'},
];

export enum AggregationOption {
  AVG_BY = 'avg_by',
  MAX_BY = 'max_by',
  MIN_BY = 'min_by',
  SUM_BY = 'sum_by',
}

export enum VisualizationDisplay {
  AREAS = 'areas',
  MAX_BY = 'max_by',
  MIN_BY = 'min_by',
  SUM_BY = 'sum_by',
}
