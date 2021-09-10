import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {Series} from 'app/types/echarts';

import {AreaWidgetFunctionProps, CommonPerformanceQueryData} from '../types';

export function transformEventsRequestToArea(
  widgetProps: AreaWidgetFunctionProps,
  results: CommonPerformanceQueryData
) {
  const {fields: chartFields} = widgetProps;
  const {start, end, utc, interval, statsPeriod} = getParams(widgetProps.location.query);

  const loading = results.loading;
  const errored = results.errored;
  const data: Series[] = results.timeseriesData as Series[];
  const previousData = results.previousTimeseriesData
    ? results.previousTimeseriesData
    : undefined;

  const childData = {
    loading,
    errored,
    data,
    previousData,
    utc: utc === 'true',
    interval,
    statsPeriod: statsPeriod ?? undefined,
    start: start ?? '',
    end: end ?? '',
    field: chartFields[0],
  };

  return childData;
}
