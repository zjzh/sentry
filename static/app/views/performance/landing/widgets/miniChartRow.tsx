import {useTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';

import space from 'app/styles/space';
import EventView from 'app/utils/discover/eventView';

import {PerformanceLayoutBodyRow} from '../../layouts';

import {PerformanceWidgetSetting} from './types';
import WidgetContainer from './widgetContainer';

export type ChartRowProps = {
  eventView: EventView;
  location: Location;
};

export const MiniChartRow = (props: ChartRowProps) => {
  const charts = 3;
  const theme = useTheme();
  const palette = theme.charts.getColorPalette(charts);
  return (
    <StyledRow minSize={200}>
      {new Array(charts).fill(0).map((_, index) => (
        <WidgetContainer
          {...props}
          key={index}
          index={index}
          chartHeight={160}
          chartColor={palette[index]}
          defaultChartSetting={PerformanceWidgetSetting.LCP_HISTOGRAM}
        />
      ))}
    </StyledRow>
  );
};

export const DoubleChartRow = (props: ChartRowProps) => {
  return (
    <StyledRow minSize={200}>
      {new Array(2).fill(0).map((_, index) => (
        <WidgetContainer
          {...props}
          key={index}
          index={index}
          chartHeight={300}
          defaultChartSetting={PerformanceWidgetSetting.LCP_HISTOGRAM}
        />
      ))}
    </StyledRow>
  );
};

const StyledRow = styled(PerformanceLayoutBodyRow)`
  margin-bottom: ${space(2)};
`;
