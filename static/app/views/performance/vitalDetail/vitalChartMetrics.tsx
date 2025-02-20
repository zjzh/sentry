import {browserHistory, withRouter, WithRouterProps} from 'react-router';
import {useTheme} from '@emotion/react';
import moment from 'moment';

import ChartZoom from 'sentry/components/charts/chartZoom';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import LineChart from 'sentry/components/charts/lineChart';
import ReleaseSeries from 'sentry/components/charts/releaseSeries';
import {ChartContainer, HeaderTitleLegend} from 'sentry/components/charts/styles';
import TransitionChart from 'sentry/components/charts/transitionChart';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import {Panel} from 'sentry/components/panels';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import {DateString, MetricsApiResponse} from 'sentry/types';
import {Series} from 'sentry/types/echarts';
import {WebVital} from 'sentry/utils/discover/fields';
import getDynamicText from 'sentry/utils/getDynamicText';

import {replaceSeriesName, transformEventStatsSmoothed} from '../trends/utils';

import {ViewProps} from './types';
import {getMaxOfSeries, getVitalChartDefinitions} from './utils';

type Props = WithRouterProps &
  Omit<ViewProps, 'query' | 'start' | 'end'> & {
    loading: boolean;
    response: MetricsApiResponse | null;
    errored: boolean;
    reloading: boolean;
    field: string;
    vital: WebVital;
    start: DateString | null;
    end: DateString | null;
  };

function VitalChartMetrics({
  reloading,
  loading,
  response,
  errored,
  statsPeriod,
  start,
  end,
  project,
  environment,
  field,
  vital,
  router,
  location,
}: Props) {
  const theme = useTheme();

  const {utc, legend, vitalPoor, markLines, chartOptions} = getVitalChartDefinitions({
    theme,
    location,
    vital,
    yAxis: field,
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
          {zoomRenderProps => {
            if (errored) {
              return (
                <ErrorPanel>
                  <IconWarning color="gray500" size="lg" />
                </ErrorPanel>
              );
            }

            const data = response?.groups.map(group => ({
              seriesName: field,
              data: response.intervals.map((intervalValue, intervalIndex) => ({
                name: moment(intervalValue).valueOf(),
                value: group.series[field][intervalIndex],
              })),
            })) as Series[] | undefined;

            const colors = (data && theme.charts.getColorPalette(data.length - 2)) || [];
            const {smoothedResults} = transformEventStatsSmoothed(data);

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
        </ChartZoom>
      </ChartContainer>
    </Panel>
  );
}

export default withRouter(VitalChartMetrics);
