import {RenderProps} from 'app/components/charts/eventsRequest';
import {
  HistogramChildren,
  HistogramChildrenProps,
} from 'app/utils/performance/histogram/histogramQuery';

export enum GenericPerformanceWidgetDataType {
  histogram = 'histogram',
  area = 'area',
  vitals = 'vitals',
}

export type HistogramQueryChildrenProps = HistogramChildrenProps;
export type HistogramQueryChildren = HistogramChildren;

export type EventsRequestChildrenProps = RenderProps;
