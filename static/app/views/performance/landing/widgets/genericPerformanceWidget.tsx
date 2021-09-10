import React, {Fragment, FunctionComponent, ReactNode, useEffect, useState} from 'react';
import {InjectedRouter, withRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {queries} from 'sentry-test/reactTestingLibrary';

import Button from 'app/components/button';
import ErrorPanel from 'app/components/charts/errorPanel';
import {EventsRequestProps} from 'app/components/charts/eventsRequest';
import {HeaderTitleLegend} from 'app/components/charts/styles';
import Link from 'app/components/links/link';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import Placeholder from 'app/components/placeholder';
import QuestionTooltip from 'app/components/questionTooltip';
import Radio from 'app/components/radio';
import {IconClose} from 'app/icons';
import {IconWarning} from 'app/icons/iconWarning';
import overflowEllipsis from 'app/styles/overflowEllipsis';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import {Series} from 'app/types/echarts';
import EventView from 'app/utils/discover/eventView';
import {QueryFieldValue, WebVital} from 'app/utils/discover/fields';
import {HistogramChildren} from 'app/utils/performance/histogram/histogramQuery';
import {DataFilter} from 'app/utils/performance/histogram/types';
import {VitalsData} from 'app/utils/performance/vitals/vitalsCardsDiscoverQuery';
import {Theme} from 'app/utils/theme';
import withOrganization from 'app/utils/withOrganization';
import DurationChart from 'app/views/performance/charts/chart';
import getPerformanceWidgetContainer, {
  PerformanceWidgetContainerTypes,
} from 'app/views/performance/landing/widgets/components/performanceWidgetContainer';
import {RadioLineItem} from 'app/views/settings/components/forms/controls/radioGroup';

import {transactionSummaryRouteWithQuery} from '../../transactionSummary/utils';
import {ChartDataProps} from '../chart/histogramChart';
import {VitalBar} from '../vitalsCards';

import {GenericPerformanceWidgetDataType} from './types';

type HeaderProps = {
  title: string;
  titleTooltip: string;
  subtitle?: JSX.Element;
};

type BaseProps = {
  fields: string[];
  chartHeight: number;
  dataType: GenericPerformanceWidgetDataType;
  containerType: PerformanceWidgetContainerTypes;
  HeaderActions?: FunctionComponent<{
    widgetData: WidgetData;
    setChartSetting: (setting: any) => void;
  }>;

  location: Location;
  eventView: EventView;
  organization: Organization;
} & HeaderProps &
  WidgetDataProps;

type HistogramWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.histogram;
  Query: FunctionComponent<
    HistogramChildren & {fields: string[]; dataFilter?: DataFilter}
  >;
  Visualization: FunctionComponent<ChartDataProps & {chartHeight: number}>;
};

type VitalsWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.vitals;
  Query: FunctionComponent<Pick<EventsRequestProps, 'children' | 'yAxis'>>;
  Visualization: FunctionComponent<React.ComponentProps<typeof DurationChart>>;
};

type Transaction = {
  transaction: string;
};

const mockData = {
  'measurements.lcp': {
    poor: 112421,
    meh: 191769,
    good: 402790,
    total: 706980,
    p75: 3393.473982810974,
  },
};

const mockDataGroupIssues = {
  'measurements.lcp': {
    poor: 53580,
    meh: 70405,
    good: 54916,
    total: 178901,
    p75: 4197.674334049225,
  },
};

const mockDataGroupEvents = {
  'measurements.lcp': {
    poor: 2536,
    meh: 2473,
    good: 2573,
    total: 7582,
    p75: 4410.349667072296,
  },
};

type FooterProps = {
  isSelected: boolean;
  transaction: Transaction;
  theme: Theme;
  index: number;
  orgSlug: string;
  data: VitalsData;
  location: Location;
  handleSelectTransaction: (txn: Transaction) => void;
};
function WidgetFooter(props: FooterProps) {
  const {
    isSelected,
    theme,
    location,
    index,
    data,
    transaction,
    orgSlug,
    handleSelectTransaction,
  } = props;
  const color = theme.purple300;

  return (
    <ListItemContainer>
      <ItemRadioContainer color={color}>
        <RadioLineItem index={index} role="radio">
          <Radio
            checked={isSelected}
            onChange={() => handleSelectTransaction(transaction)}
          />
        </RadioLineItem>
      </ItemRadioContainer>
      <ItemTransactionName
        to={transactionSummaryRouteWithQuery({
          orgSlug,
          transaction: transaction.transaction,
          query: location.query,
        })}
      >
        {transaction.transaction}
      </ItemTransactionName>
      <VitalBar
        isLoading={false}
        vital={WebVital.LCP}
        data={data}
        showDetail={false}
        barHeight={24}
      />
      <Button borderless size="zero">
        <IconClose />
      </Button>
    </ListItemContainer>
  );
}
const ItemTransactionName = styled(Link)`
  font-size: ${p => p.theme.fontSizeMedium};
  margin-right: ${space(1)};
  ${overflowEllipsis};
`;

const ItemRadioContainer = styled('div')`
  grid-row: 1/3;
  input {
    cursor: pointer;
  }
  input:checked::after {
    background-color: ${p => p.color};
  }
`;
const ListItemContainer = styled('div')`
  display: grid;
  grid-template-columns: 24px auto 250px 30px;
  grid-template-rows: repeat(2, auto);
  grid-column-gap: ${space(1)};
  border-top: 1px solid ${p => p.theme.border};
  padding: ${space(1)} ${space(2)};
`;

const WidgetHeaderContainer = styled('div')`
  display: flex;
  justify-content: space-between;
`;
const HeaderActionsContainer = styled('div')``;

type WidgetPropUnion = HistogramWidgetProps | AreaWidgetProps | VitalsWidgetProps;

interface WidgetDataTypes extends CommonPerformanceQueryData {}
// TODO(k-fish): Refine this.
type WidgetData = {
  [dataKey: string]: WidgetDataTypes;
};

export type WidgetDataProps = {
  widgetData: WidgetData;
  setWidgetDataForKey: (dataKey: string, result: WidgetDataTypes) => {};
};
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
          <AreaWidget {...props} {...widgetProps} />
        </QueryHandler>
      );
    case GenericPerformanceWidgetDataType.histogram:
      return <HistogramWidget {...props} {...widgetProps} />;
    case GenericPerformanceWidgetDataType.vitals:
      return <VitalsWidget {...props} {...widgetProps} />;
    default:
      throw new Error('Missing support for data type');
  }
}

type AreaWidgetFunctionProps = AreaWidgetProps & {router: InjectedRouter};

const defaultGrid = {
  left: space(0),
  right: space(0),
  top: space(2),
  bottom: space(0),
};

export function transformAreaResults(
  widgetProps: AreaWidgetFunctionProps,
  results: CommonPerformanceQueryData
) {
  const {router, fields: chartFields} = widgetProps;
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
    router,
    field: chartFields[0],
  };

  return childData;
}

function _AreaWidget(props: AreaWidgetFunctionProps) {
  const {Visualizations, chartHeight, containerType} = props;

  const Container = getPerformanceWidgetContainer({
    containerType,
  });

  const childData = props.widgetData[Object.keys(Visualizations)[0]];

  return (
    <Container>
      <ContentContainer>
        <WidgetHeader {...props} />
        <DataStateSwitch
          {...childData}
          hasData={!!(childData?.data && childData?.data.length)}
          errorComponent={<DefaultErrorComponent height={chartHeight} />}
          dataComponents={Object.entries(Visualizations).map(([key, Visualization]) => (
            <Visualization.component
              key={key}
              grid={defaultGrid}
              {...props.widgetData[key]}
              widgetData={props.widgetData}
              height={chartHeight}
            />
          ))}
          emptyComponent={<Placeholder height={`${chartHeight}px`} />}
        />
      </ContentContainer>
    </Container>
  );
}

export const AreaWidget = withRouter(_AreaWidget);

type QueryDefinitionWithKey = QueryDefinition & {queryKey: string};
type QueryHandlerProps = {
  queries: QueryDefinitionWithKey[];
  children: ReactNode;
  queryProps: AreaWidgetFunctionProps;
} & WidgetDataProps;

function _VitalsWidget(
  props: VitalsWidgetProps & {
    router: InjectedRouter;
    location: Location;
    organization: Organization;
    theme: Theme;
  }
) {
  const {
    fields: chartFields,
    Query,
    location,
    Visualization: Chart,
    organization,
    HeaderActions,
    chartHeight,
    router,
    containerType,
  } = props;
  return (
    <Query yAxis={chartFields}>
      {results => {
        const loading = results.loading;
        const errored = results.errored;
        const data: Series[] = results.results as Series[];

        const start = null;

        const end = null;
        const utc = false;
        const statsPeriod = '7d';

        const Container = getPerformanceWidgetContainer({
          containerType,
        });

        const childData = {
          results: results.results,
          loading,
          errored,
          data,
          start,
          end,
          utc,
          statsPeriod,
          router,
          location,
          field: chartFields[0],
        };

        return (
          <Container>
            <ContentContainer>
              <WidgetHeader
                {...props}
                renderedActions={
                  HeaderActions && <HeaderActions grid={grid} {...childData} />
                }
                subtitle={
                  <VitalBar
                    isLoading={false}
                    vital={WebVital.LCP}
                    data={mockDataGroupIssues}
                    showDetail
                    showBar={false}
                  />
                }
              />
              <DataStateSwitch
                {...childData}
                hasData={!!(data && data.length)}
                errorComponent={<DefaultErrorComponent height={chartHeight} />}
                dataComponents={<Chart {...childData} height={chartHeight} />}
                emptyComponent={<Placeholder height={`${chartHeight}px`} />}
              />
            </ContentContainer>
            <WidgetFooter
              {...props}
              isSelected
              transaction={{transaction: '/organizations/:orgId/issues/:groupId/ '}}
              handleSelectTransaction={(_: Transaction) => {}}
              orgSlug={organization.slug}
              index={0}
              data={mockDataGroupIssues}
            />
            <WidgetFooter
              {...props}
              isSelected={false}
              transaction={{
                transaction: '/organizations/:orgId/issues/:groupId/events/:eventId/',
              }}
              handleSelectTransaction={(_: Transaction) => {}}
              orgSlug={organization.slug}
              index={1}
              data={mockDataGroupEvents}
            />
            <WidgetFooter
              {...props}
              isSelected={false}
              transaction={{transaction: '/organizations/:orgId/issues/'}}
              handleSelectTransaction={(_: Transaction) => {}}
              orgSlug={organization.slug}
              index={2}
              data={mockData}
            />
          </Container>
        );
      }}
    </Query>
  );
}
const ContentContainer = styled('div')`
  padding-left: ${space(2)};
  padding-right: ${space(2)};
  padding-bottom: ${space(2)};
`;
const VitalsWidget = withTheme(withOrganization(withRouter(_VitalsWidget)));

function HistogramWidget(props: HistogramWidgetProps) {
  const {
    fields: chartFields,
    Query,
    Visualization: Chart,
    HeaderActions,
    chartHeight,
    containerType,
  } = props;
  return (
    <Query fields={chartFields} dataFilter="exclude_outliers">
      {results => {
        const loading = results.isLoading;
        const errored = results.error !== null;
        const chartData = results.histograms?.[chartFields[0]];

        const Container = getPerformanceWidgetContainer({
          containerType,
        });

        const childData = {
          loading,
          errored,
          chartData,
          field: chartFields[0],
        };

        return (
          <Container>
            <ContentContainer>
              <WidgetHeader
                {...props}
                renderedActions={
                  HeaderActions && <HeaderActions grid={grid} {...childData} />
                }
              />
              <DataStateSwitch
                {...childData}
                hasData={!!(chartData && chartData.length)}
                errorComponent={<DefaultErrorComponent height={chartHeight} />}
                dataComponents={
                  <Chart {...childData} grid={grid} chartHeight={chartHeight} />
                }
                emptyComponent={<Placeholder height={`${chartHeight}px`} />}
              />
            </ContentContainer>
          </Container>
        );
      }}
    </Query>
  );
}

const DefaultErrorComponent = (props: {height: number}) => {
  return (
    <ErrorPanel height={`${props.height}px`}>
      <IconWarning color="gray300" size="lg" />
    </ErrorPanel>
  );
};

GenericPerformanceWidget.defaultProps = {
  containerType: 'panel',
  chartHeight: 200,
};
