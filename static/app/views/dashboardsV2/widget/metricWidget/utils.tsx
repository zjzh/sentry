import {SessionApiResponse} from 'app/types';
import {Series} from 'app/types/echarts';

type ChartData = Record<string, Series>;

export function getBreakdownChartData({
  response,
  legend,
  groupBy,
}: {
  response: SessionApiResponse;
  legend: string;
  groupBy?: string[];
}): ChartData {
  return response.groups.reduce((groups, group, index) => {
    for (const groupByIndex in groupBy) {
      const key = groupBy ? group.by[groupBy[groupByIndex]] : index;
      groups[key] = {
        seriesName: legend,
        data: [],
      };
    }
    return groups;
  }, {});
}

type FillChartDataFromMetricsResponse = {
  response: SessionApiResponse;
  field: string;
  chartData: ChartData;
  groupBy?: string[];
  valueFormatter?: (value: number) => number;
};

export function fillChartDataFromMetricsResponse({
  response,
  field,
  groupBy,
  chartData,
  valueFormatter,
}: FillChartDataFromMetricsResponse) {
  response.intervals.forEach((interval, index) => {
    response.groups.forEach(group => {
      const value = group.series[field][index];
      if (!groupBy) {
        chartData[0].data.push({
          name: interval,
          value: typeof valueFormatter === 'function' ? valueFormatter(value) : value,
        });
      } else {
        for (const groupByIndex in groupBy) {
          chartData[group.by[groupBy[groupByIndex]]].data.push({
            name: interval,
            value: typeof valueFormatter === 'function' ? valueFormatter(value) : value,
          });
        }
      }
    });
  });

  return chartData;
}
