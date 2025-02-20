import {browserHistory, withRouter, WithRouterProps} from 'react-router';
import {useTheme} from '@emotion/react';

import ChartZoom from 'sentry/components/charts/chartZoom';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import EventsRequest from 'sentry/components/charts/eventsRequest';
import LineChart from 'sentry/components/charts/lineChart';
import ReleaseSeries from 'sentry/components/charts/releaseSeries';
import {ChartContainer, HeaderTitleLegend} from 'sentry/components/charts/styles';
import TransitionChart from 'sentry/components/charts/transitionChart';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import {Panel} from 'sentry/components/panels';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import {DateString, OrganizationSummary} from 'sentry/types';
import {Series} from 'sentry/types/echarts';
import {axisLabelFormatter, tooltipFormatter} from 'sentry/utils/discover/charts';
import {WebVital} from 'sentry/utils/discover/fields';
import getDynamicText from 'sentry/utils/getDynamicText';
import useApi from 'sentry/utils/useApi';

import {replaceSeriesName, transformEventStatsSmoothed} from '../trends/utils';

import {ViewProps} from './types';
import {
  getMaxOfSeries,
  getVitalChartDefinitions,
  vitalNameFromLocation,
  VitalState,
  vitalStateColors,
} from './utils';

type Props = WithRouterProps &
  Omit<ViewProps, 'start' | 'end'> & {
    organization: OrganizationSummary;
    start: DateString | null;
    end: DateString | null;
    interval: string;
  };

function VitalChart({
  project,
  environment,
  location,
  organization,
  query,
  statsPeriod,
  router,
  start,
  end,
  interval,
}: Props) {
  const api = useApi();
  const theme = useTheme();

  const vitalName = vitalNameFromLocation(location);
  const yAxis = `p75(${vitalName})`;

  const {utc, legend, vitalPoor, markLines, chartOptions} = getVitalChartDefinitions({
    theme,
    location,
    yAxis,
    vital: vitalName,
  });

  function handleLegendSelectChanged(legendChange: {
    name: string;
    type: string;
    selected: Record<string, boolean>;
  }) {
    const {selected} = legendChange;
    const unselected = Object.keys(selected).filter(key => !selected[key]);

    const to = {
      ...location,
      query: {
        ...location.query,
        unselectedSeries: unselected,
      },
    };
    browserHistory.push(to);
  }

  return (
    <Panel>
      <ChartContainer>
        <HeaderTitleLegend>
          {t('Duration p75')}
          <QuestionTooltip
            size="sm"
            position="top"
            title={t(`The durations shown should fall under the vital threshold.`)}
          />
        </HeaderTitleLegend>
        <ChartZoom router={router} period={statsPeriod} start={start} end={end} utc={utc}>
          {zoomRenderProps => (
            <EventsRequest
              api={api}
              organization={organization}
              period={statsPeriod}
              project={project}
              environment={environment}
              start={start}
              end={end}
              interval={interval}
              showLoading={false}
              query={query}
              includePrevious={false}
              yAxis={[yAxis]}
              partial
            >
              {({timeseriesData: results, errored, loading, reloading}) => {
                if (errored) {
                  return (
                    <ErrorPanel>
                      <IconWarning color="gray500" size="lg" />
                    </ErrorPanel>
                  );
                }

                const colors =
                  (results && theme.charts.getColorPalette(results.length - 2)) || [];

                const {smoothedResults} = transformEventStatsSmoothed(results);

                const smoothedSeries = smoothedResults
                  ? smoothedResults.map(({seriesName, ...rest}, i: number) => {
                      return {
                        seriesName: replaceSeriesName(seriesName) || 'p75',
                        ...rest,
                        color: colors[i],
                        lineStyle: {
                          opacity: 1,
                          width: 2,
                        },
                      };
                    })
                  : [];

                const seriesMax = getMaxOfSeries(smoothedSeries);
                const yAxisMax = Math.max(seriesMax, vitalPoor);
                chartOptions.yAxis.max = yAxisMax * 1.1;

                return (
                  <ReleaseSeries
                    start={start}
                    end={end}
                    period={statsPeriod}
                    utc={utc}
                    projects={project}
                    environments={environment}
                  >
                    {({releaseSeries}) => (
                      <TransitionChart loading={loading} reloading={reloading}>
                        <TransparentLoadingMask visible={reloading} />
                        {getDynamicText({
                          value: (
                            <LineChart
                              {...zoomRenderProps}
                              {...chartOptions}
                              legend={legend}
                              onLegendSelectChanged={handleLegendSelectChanged}
                              series={[...markLines, ...releaseSeries, ...smoothedSeries]}
                            />
                          ),
                          fixed: 'Web Vitals Chart',
                        })}
                      </TransitionChart>
                    )}
                  </ReleaseSeries>
                );
              }}
            </EventsRequest>
          )}
        </ChartZoom>
      </ChartContainer>
    </Panel>
  );
}

export default withRouter(VitalChart);

export type _VitalChartProps = {
  loading: boolean;
  reloading: boolean;
  field: string;
  grid: React.ComponentProps<typeof LineChart>['grid'];
  data?: Series[];
  height?: number;
  utc?: boolean;
  vitalFields?: {
    poorCountField: string;
    mehCountField: string;
    goodCountField: string;
  };
};

function fieldToVitalType(
  seriesName: string,
  vitalFields: _VitalChartProps['vitalFields']
): VitalState | undefined {
  if (seriesName === vitalFields?.poorCountField.replace('equation|', '')) {
    return VitalState.POOR;
  }
  if (seriesName === vitalFields?.mehCountField.replace('equation|', '')) {
    return VitalState.MEH;
  }
  if (seriesName === vitalFields?.goodCountField.replace('equation|', '')) {
    return VitalState.GOOD;
  }

  return undefined;
}

export function _VitalChart(props: _VitalChartProps) {
  const {
    field: yAxis,
    data: _results,
    loading,
    reloading,
    height,
    grid,
    utc,
    vitalFields,
  } = props;

  if (!_results || !vitalFields) {
    return null;
  }
  const theme = useTheme();

  const chartOptions = {
    grid,
    seriesOptions: {
      showSymbol: false,
    },
    tooltip: {
      trigger: 'axis' as const,
      valueFormatter: (value: number, seriesName?: string) => {
        return tooltipFormatter(
          value,
          vitalFields[0] === WebVital.CLS ? seriesName : yAxis
        );
      },
    },
    xAxis: {
      show: false,
    },
    xAxes: undefined,
    yAxis: {
      axisLabel: {
        color: theme.chartLabel,
        showMaxLabel: false,
        formatter: (value: number) => axisLabelFormatter(value, yAxis),
      },
    },
    utc,
    isGroupedByDate: true,
    showTimeInTooltip: true,
  };

  const results = _results.filter(s => !!fieldToVitalType(s.seriesName, vitalFields));

  const smoothedSeries = results?.length
    ? results.map(({seriesName, ...rest}) => {
        const adjustedSeries = fieldToVitalType(seriesName, vitalFields) || 'count';
        return {
          seriesName: adjustedSeries,
          ...rest,
          color: theme[vitalStateColors[adjustedSeries]],
          lineStyle: {
            opacity: 1,
            width: 2,
          },
        };
      })
    : [];

  return (
    <div>
      <TransitionChart loading={loading} reloading={reloading}>
        <TransparentLoadingMask visible={reloading} />
        {getDynamicText({
          value: (
            <LineChart
              height={height}
              {...chartOptions}
              onLegendSelectChanged={() => {}}
              series={[...smoothedSeries]}
              isGroupedByDate
            />
          ),
          fixed: 'Web Vitals Chart',
        })}
      </TransitionChart>
    </div>
  );
}
