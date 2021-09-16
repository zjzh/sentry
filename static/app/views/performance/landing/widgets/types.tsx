import {FunctionComponent, ReactNode} from 'react';
import {Location} from 'history';

import BaseChart from 'app/components/charts/baseChart';
import {RenderProps} from 'app/components/charts/eventsRequest';
import {Organization} from 'app/types';
import {Series} from 'app/types/echarts';
import EventView from 'app/utils/discover/eventView';
import {
  HistogramChildren,
  HistogramChildrenProps,
} from 'app/utils/performance/histogram/histogramQuery';

import {PerformanceWidgetContainerTypes} from './components/performanceWidgetContainer';

export enum GenericPerformanceWidgetDataType {
  histogram = 'histogram',
  area = 'area',
  vitals = 'vitals',
  trends = 'trends',
}

export enum VisualizationDataState {
  ERROR = 'error',
  LOADING = 'loading',
  EMPTY = 'empty',
  DATA = 'data',
}

export enum PerformanceWidgetSetting {
  LCP_HISTOGRAM = 'lcp_histogram',
  FCP_HISTOGRAM = 'fcp_histogram',
  FID_HISTOGRAM = 'fid_histogram',
  TPM_AREA = 'tpm_area',
  FAILURE_RATE_AREA = 'failure_rate_area',
  USER_MISERY_AREA = 'user_misery_area',
  WORST_LCP_VITALS = 'worst_lcp_vitals',
  MOST_IMPROVED = 'most_improved',
  MOST_REGRESSED = 'most_regressed',
}
export interface WidgetDataResult {
  isLoading: boolean;
  isErrored: boolean;
  hasData: boolean;
}
export interface WidgetDataConstraint {
  [dataKey: string]: WidgetDataResult | undefined;
}

export type QueryChildren = {
  children: (props: any) => ReactNode; // TODO(k-fish): Fix any type.
};
export type QueryFC = FunctionComponent<QueryChildren>;

export type QueryDefinition<
  T extends WidgetDataConstraint,
  S extends WidgetDataResult | undefined
> = {
  component: QueryFC;
  enabled?: (data: T) => boolean;
  transform: (props: AreaWidgetFunctionProps<T>, results: any) => S; // TODO(k-fish): Fix any type.
};
export type Queries<T extends WidgetDataConstraint> = Record<
  string,
  QueryDefinition<T, T[string]>
>;

type Visualization<T> = {
  component: FunctionComponent<{
    widgetData: T;
    queryFields?: string;
    grid?: React.ComponentProps<typeof BaseChart>['grid'];
    height?: number;
  }>;
  dataState?: (data: T) => VisualizationDataState;
  fields?: string;
  noPadding?: boolean;
  bottomPadding?: boolean;
  queryFields?: string[];
  height: number; // Used to determine placeholder and loading sizes. Will also be passed to the component.
};

type Visualizations<T extends WidgetDataConstraint> = Readonly<Visualization<T>[]>; // Readonly because of index being used for React key.

type HeaderActions<T> = FunctionComponent<{
  widgetData: T;
  setChartSetting: (setting: PerformanceWidgetSetting) => void;
}>;

export type GenericPerformanceWidgetProps<T extends WidgetDataConstraint> = {
  // Header;
  title: string;
  titleTooltip: string;
  subtitle?: JSX.Element;
  setChartSetting: (setting: PerformanceWidgetSetting) => void;

  fields: string[];
  chartHeight: number;
  dataType: GenericPerformanceWidgetDataType;
  containerType: PerformanceWidgetContainerTypes;

  location: Location;
  eventView: EventView;
  organization: Organization;

  // Components
  HeaderActions?: HeaderActions<T>;
  Queries: Queries<T>;
  Visualizations: Visualizations<T>;
};

export type GenericPerformanceWithData<T extends WidgetDataConstraint> =
  GenericPerformanceWidgetProps<T> & WidgetDataProps<T>;

export type WidgetDataProps<T> = {
  widgetData: T;
  setWidgetDataForKey: (dataKey: string, result?: WidgetDataResult) => void;
};

export type HistogramQueryChildrenProps = HistogramChildrenProps;
export type HistogramQueryChildren = HistogramChildren;

export type EventsRequestChildrenProps = RenderProps;

export type CommonPerformanceQueryData = {
  data: any;
  loading: boolean;
  // reloading: boolean;
  errored: boolean;

  timeseriesData?: Series[];
  previousTimeseriesData?: Series[];
};

export type AreaWidgetFunctionProps<T extends WidgetDataConstraint> = AreaWidgetProps<T>;

export type AreaWidgetProps<T extends WidgetDataConstraint> =
  GenericPerformanceWidgetProps<T> & {
    dataType: GenericPerformanceWidgetDataType.area;
  };

export interface WidgetDataTypes extends CommonPerformanceQueryData {}
// TODO(k-fish): Refine this.
export type WidgetData = {
  [dataKey: string]: WidgetDataTypes;
};

export type QueryDefinitionWithKey<T extends WidgetDataConstraint> = QueryDefinition<
  T,
  T[string]
> & {queryKey: string};

export type QueryHandlerProps<T extends WidgetDataConstraint> = {
  queries: QueryDefinitionWithKey<T>[];
  children: ReactNode;
  queryProps: WidgetPropUnion<T>;
} & WidgetDataProps<T>;

export type WidgetPropUnion<T extends WidgetDataConstraint> = AreaWidgetProps<T>;
