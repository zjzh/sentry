import {useState} from 'react';
import {withRouter} from 'react-router';
import styled from '@emotion/styled';

import ErrorPanel from 'app/components/charts/errorPanel';
import Placeholder from 'app/components/placeholder';
import {IconWarning} from 'app/icons/iconWarning';
import space from 'app/styles/space';
import getPerformanceWidgetContainer from 'app/views/performance/landing/widgets/components/performanceWidgetContainer';

import {
  AreaWidgetFunctionProps,
  AreaWidgetProps,
  GenericPerformanceWidgetDataType,
  WidgetData,
  WidgetDataProps,
  WidgetDataTypes,
} from '../types';

import {DataStateSwitch} from './dataStateSwitch';
import {QueryHandler} from './queryHandler';
import {WidgetHeader} from './widgetHeader';

type WidgetPropUnion = AreaWidgetProps;

export function GenericPerformanceWidget(props: WidgetPropUnion) {
  const [widgetData, setWidgetData] = useState<WidgetData>({});

  const setWidgetDataForKey = (dataKey: string, result: WidgetDataTypes) => {
    const newData: WidgetData = {...widgetData, [dataKey]: result};
    setWidgetData(newData);
  };
  const widgetProps = {widgetData, setWidgetDataForKey};

  switch (props.dataType) {
    case GenericPerformanceWidgetDataType.area:
      return (
        <QueryHandler
          widgetData={widgetData}
          setWidgetDataForKey={setWidgetDataForKey}
          queryProps={props}
          queries={Object.entries(props.Queries).map(([key, definition]) => ({
            ...definition,
            queryKey: key,
          }))}
        >
          <_AreaWidget {...props} {...widgetProps} />
        </QueryHandler>
      );
    default:
      throw new Error(`Missing support for data type: '${props.dataType}'`);
  }
}

const defaultGrid = {
  left: space(0),
  right: space(0),
  top: space(2),
  bottom: space(0),
};

function _AreaWidget(props: AreaWidgetFunctionProps & WidgetDataProps) {
  const {Visualizations, chartHeight, containerType} = props;

  const Container = getPerformanceWidgetContainer({
    containerType,
  });

  const childData = props.widgetData[Object.keys(Visualizations)[0]];

  return (
    <Container>
      <ContentContainer>
        <WidgetHeader {...props} />
      </ContentContainer>
      <DataStateSwitch
        {...childData}
        hasData={!!(childData?.data && childData?.data.length) || childData?.hasData}
        errorComponent={<DefaultErrorComponent height={chartHeight} />}
        dataComponents={Object.entries(Visualizations).map(([key, Visualization]) => (
          <ContentContainer key={key} noPadding={Visualization.noPadding}>
            <Visualization.component
              grid={defaultGrid}
              {...(props.widgetData[key] ?? {})}
              queryFields={Visualization.fields}
              widgetData={props.widgetData}
              height={chartHeight}
            />
          </ContentContainer>
        ))}
        emptyComponent={<Placeholder height={`${chartHeight}px`} />}
      />
    </Container>
  );
}

export const AreaWidget = withRouter(_AreaWidget);

const DefaultErrorComponent = (props: {height: number}) => {
  return (
    <ErrorPanel height={`${props.height}px`}>
      <IconWarning color="gray300" size="lg" />
    </ErrorPanel>
  );
};

const ContentContainer = styled('div')<{noPadding?: boolean}>`
  padding-left: ${p => (p.noPadding ? space(0) : space(2))};
  padding-right: ${p => (p.noPadding ? space(0) : space(2))};
  padding-bottom: ${p => (p.noPadding ? space(0) : space(0))};
`;
GenericPerformanceWidget.defaultProps = {
  containerType: 'panel',
  chartHeight: 200,
};
