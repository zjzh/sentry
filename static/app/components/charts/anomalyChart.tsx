import * as React from 'react';
import color from 'color';
import {EChartOption} from 'echarts/lib/echarts';

import MarkArea from 'app/components/charts/components/markArea';
import {Series} from 'app/types/echarts';
import theme from 'app/utils/theme';

import BarSeries from './series/barSeries';
import LineSeries from './series/lineSeries';
import BaseChart from './baseChart';
import {LineChartSeries} from './lineChart';

type ChartProps = React.ComponentProps<typeof BaseChart>;

type Props = Omit<ChartProps, 'series'> & {
  series: LineChartSeries[];
  anomalySeries?: AnomalySeries;
};

export type AnomalySeries = {
  anomaly: Series;
  min: Series;
  max: Series;
};

class AnomalyChart extends React.Component<Props> {
  render() {
    const {series, anomalySeries, grid: _grid, yAxis, xAxis, ...props} = this.props;

    const grid = _grid?.[0] ??
      _grid ?? {
        left: '24px',
        right: '24px',
        top: '32px',
        bottom: '12px',
      };

    const dataSeries = series.map(({seriesName, data, dataArray, ...options}) =>
      LineSeries({
        ...options,
        name: seriesName,
        data: dataArray || data.map(({value, name}) => [name, value]),
        animation: false,
        animationThreshold: 1,
        animationDuration: 0,
      })
    );

    const otherSeries: EChartOption.Series[] = [];

    const min = anomalySeries?.min;
    const max = anomalySeries?.max;

    if (min && max) {
      otherSeries.push(
        LineSeries({
          name: min.seriesName,
          data: min.data.map(({value, name}) => [name, value]),
          animation: false,
          animationThreshold: 1,
          animationDuration: 0,
          lineStyle: {
            opacity: 0,
          },
          stack: 'confidence-band',
        })
      );

      otherSeries.push(
        LineSeries({
          name: max.seriesName,
          data: max.data.map(({value, name}, i) => [name, value - min.data[i].value]),
          animation: false,
          animationThreshold: 1,
          animationDuration: 0,
          lineStyle: {
            opacity: 0,
          },
          areaStyle: {
            color: color(theme.green300).alpha(0.42).rgb().string(),
          },
          stack: 'confidence-band',
        })
      );
    }

    const anomaly = anomalySeries?.anomaly;
    if (anomaly) {
      const meh = 0.33;
      const poor = 0.66;
      otherSeries.push(
        BarSeries({
          name: anomaly.seriesName,
          data: anomaly.data.map(({value, name}) => ({
            value: [name, value],
            itemStyle: {
              color:
                value <= meh
                  ? theme.green300
                  : value <= poor
                  ? theme.yellow300
                  : theme.red300,
            },
          })),
          animation: false,
          animationThreshold: 1,
          animationDuration: 0,
          xAxisIndex: 1,
          yAxisIndex: 1,
        })
      );

      let poorRegions: any[][] = [[]];
      let mehRegions: any[][] = [[]];

      const interval =
        anomaly.data.length > 2
          ? Math.floor(
              ((anomaly.data[1].name as number) - (anomaly.data[0].name as number)) / 2
            )
          : 0;

      for (let i = 0; i < anomaly.data.length; i++) {
        const {name, value} = anomaly.data[i];
        if (meh < value && value <= poor) {
          mehRegions[mehRegions.length - 1].push(name);
        } else if (mehRegions[mehRegions.length - 1].length) {
          mehRegions.push([]);
        }

        if (value > poor) {
          poorRegions[poorRegions.length - 1].push(name);
        } else if (poorRegions[poorRegions.length - 1].length) {
          poorRegions.push([]);
        }
      }
      mehRegions = mehRegions
        .filter(region => region.length)
        .map(region => [region[0], region[region.length - 1]]);
      poorRegions = poorRegions
        .filter(region => region.length)
        .map(region => [region[0], region[region.length - 1]]);

      otherSeries.push(
        LineSeries({
          markArea: MarkArea({
            itemStyle: {
              color: color(theme.yellow300).alpha(0.42).rgb().string(),
            },
            data: mehRegions.map(region => [
              {xAxis: region[0]},
              {xAxis: region[1]},
            ]) as any,
          }),
          data: [],
        })
      );

      otherSeries.push(
        LineSeries({
          markArea: MarkArea({
            itemStyle: {
              color: color(theme.red300).alpha(0.42).rgb().string(),
            },
            data: poorRegions.map(region => [
              {xAxis: region[0] - interval},
              {xAxis: region[1] + interval},
            ]) as any,
          }),
          data: [],
        })
      );
    }

    return (
      <BaseChart
        {...props}
        grid={[
          {...grid, bottom: '32%'},
          {...grid, top: '70%'},
        ]}
        yAxes={[
          {...(yAxis ?? {}), gridIndex: 0},
          {gridIndex: 1, min: 0, max: 1, minInterval: 1},
        ]}
        xAxes={[{...(xAxis ?? {}), gridIndex: 0}, {gridIndex: 1}]}
        series={[...dataSeries, ...otherSeries]}
      />
    );
  }
}

export default AnomalyChart;
