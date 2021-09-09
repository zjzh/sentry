import styled from '@emotion/styled';
import {Location} from 'history';

import space from 'app/styles/space';
import EventView from 'app/utils/discover/eventView';

import {PerformanceLayoutBodyRow} from '../../layouts';

import WidgetContainer, {performanceWidgetSetting} from './widgetContainer';

export type ChartRowProps = {
  eventView: EventView;
  location: Location;
};

export const MiniChartRow = (props: ChartRowProps) => {
  return (
    <StyledRow minSize={200}>
      {new Array(3).fill(0).map((_, index) => (
        <WidgetContainer
          {...props}
          key={index}
          index={index}
          chartHeight={160}
          isNewType={index === 0}
          defaultChartSetting={performanceWidgetSetting.LCP_HISTOGRAM}
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
          defaultChartSetting={performanceWidgetSetting.LCP_HISTOGRAM}
        />
      ))}
    </StyledRow>
  );
};

const StyledRow = styled(PerformanceLayoutBodyRow)`
  margin-bottom: ${space(2)};
`;
