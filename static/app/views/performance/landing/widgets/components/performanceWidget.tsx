import {Fragment, useMemo, useState} from 'react';
import {withRouter} from 'react-router';
import styled from '@emotion/styled';

import ErrorPanel from 'app/components/charts/errorPanel';
import Placeholder from 'app/components/placeholder';
import {IconWarning} from 'app/icons/iconWarning';
import space from 'app/styles/space';
import getPerformanceWidgetContainer from 'app/views/performance/landing/widgets/components/performanceWidgetContainer';

import {
  GenericPerformanceWidgetProps,
  WidgetDataConstraint,
  WidgetDataProps,
  WidgetDataResult,
  WidgetPropUnion,
} from '../types';

import {DataStateSwitch} from './dataStateSwitch';
import {QueryHandler} from './queryHandler';
import {WidgetHeader} from './widgetHeader';

// Generic performance widget for type T, which defines all the data contained in the widget.
export function GenericPerformanceWidget<T extends WidgetDataConstraint>(
  props: WidgetPropUnion<T>
) {
  const [widgetData, setWidgetData] = useState<T>({} as T);

  const setWidgetDataForKey = (dataKey: string, result?: WidgetDataResult) => {
    if (result) {
      setWidgetData({...widgetData, [dataKey]: result});
    }
  };
  const widgetProps = {widgetData, setWidgetDataForKey};

  const queries = useMemo(() => {
    return Object.entries(props.Queries).map(([key, definition]) => ({
      ...definition,
      queryKey: key,
    }));
  }, [props.Queries]);

  return (
    <Fragment>
      <QueryHandler
        widgetData={widgetData}
        setWidgetDataForKey={setWidgetDataForKey}
        queryProps={props}
        queries={queries}
      />
      <_DataDisplay<T> {...props} {...widgetProps} />
    </Fragment>
  );
}

function _DataDisplay<T extends WidgetDataConstraint>(
  props: GenericPerformanceWidgetProps<T> & WidgetDataProps<T>
) {
  const {Visualizations, chartHeight, containerType} = props;

  const Container = getPerformanceWidgetContainer({
    containerType,
  });

  const missingDataKeys = !Object.values(props.widgetData).length;
  const hasData =
    !missingDataKeys && Object.values(props.widgetData).every(d => !d || d.hasData);
  const isLoading =
    !missingDataKeys && Object.values(props.widgetData).some(d => !d || d.isLoading);
  const isErrored =
    !missingDataKeys && Object.values(props.widgetData).some(d => d && d.isErrored);

  return (
    <Container>
      <ContentContainer>
        <WidgetHeader<T> {...props} />
      </ContentContainer>
      <DataStateSwitch
        isLoading={isLoading}
        isErrored={isErrored}
        hasData={hasData}
        errorComponent={<DefaultErrorComponent height={chartHeight} />}
        dataComponents={Visualizations.map((Visualization, index) => (
          <ContentContainer
            key={index}
            noPadding={Visualization.noPadding}
            bottomPadding={Visualization.bottomPadding}
          >
            <Visualization.component
              {...props}
              grid={defaultGrid}
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

export const DataDisplay = withRouter(_DataDisplay);

const DefaultErrorComponent = (props: {height: number}) => {
  return (
    <ErrorPanel height={`${props.height}px`}>
      <IconWarning color="gray300" size="lg" />
    </ErrorPanel>
  );
};

const defaultGrid = {
  left: space(0),
  right: space(0),
  top: space(2),
  bottom: space(0),
};

const ContentContainer = styled('div')<{noPadding?: boolean; bottomPadding?: boolean}>`
  padding-left: ${p => (p.noPadding ? space(0) : space(2))};
  padding-right: ${p => (p.noPadding ? space(0) : space(2))};
  padding-bottom: ${p => (p.bottomPadding ? space(1) : space(0))};
`;
GenericPerformanceWidget.defaultProps = {
  containerType: 'panel',
  chartHeight: 200,
};
