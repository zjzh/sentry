import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import Button from 'app/components/button';
import ErrorPanel from 'app/components/charts/errorPanel';
import {EventsRequestProps} from 'app/components/charts/eventsRequest';
import {HeaderTitleLegend} from 'app/components/charts/styles';
import Link from 'app/components/links/link';
import Placeholder from 'app/components/placeholder';
import QuestionTooltip from 'app/components/questionTooltip';
import Radio from 'app/components/radio';
import {IconClose} from 'app/icons';
import {IconWarning} from 'app/icons/iconWarning';
import overflowEllipsis from 'app/styles/overflowEllipsis';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import {Series} from 'app/types/echarts';
import {WebVital} from 'app/utils/discover/fields';
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
import {Location} from 'history';
import React, {FunctionComponent, ReactNode} from 'react';
import {InjectedRouter, withRouter} from 'react-router';
import {transactionSummaryRouteWithQuery} from '../../transactionSummary/utils';
import {ChartDataProps} from '../chart/histogramChart';
import {VitalBar} from '../vitalsCards';

export enum GenericPerformanceWidgetDataType {
  histogram = 'histogram',
  area = 'area',
  vitals = 'vitals',
}

type HeaderProps = {
  title: string;
  titleTooltip: string;
  subtitle?: JSX.Element;
};

type BaseProps = {
  chartFields: string[];
  chartHeight: number;
  dataType: GenericPerformanceWidgetDataType;
  containerType: PerformanceWidgetContainerTypes;
  HeaderActions?: FunctionComponent<ChartDataProps>;
} & HeaderProps;

type HistogramWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.histogram;
  Query: FunctionComponent<
    HistogramChildren & {fields: string[]; dataFilter?: DataFilter}
  >;
  Chart: FunctionComponent<ChartDataProps & {chartHeight: number}>;
};

type AreaWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.area;
  Query: FunctionComponent<Pick<EventsRequestProps, 'children' | 'yAxis'>>;
  Chart: FunctionComponent<React.ComponentProps<typeof DurationChart>>;
};

type VitalsWidgetProps = BaseProps & {
  dataType: GenericPerformanceWidgetDataType.vitals;
  Query: FunctionComponent<Pick<EventsRequestProps, 'children' | 'yAxis'>>;
  Chart: FunctionComponent<React.ComponentProps<typeof DurationChart>>;
};

function DataStateSwitch(props: {
  loading: boolean;
  errored: boolean;
  hasData: boolean;

  loadingComponent?: JSX.Element;
  errorComponent: JSX.Element;
  dataComponent: JSX.Element;
  emptyComponent: JSX.Element;
}): JSX.Element {
  if (props.loading && props.loadingComponent) {
    return props.loadingComponent;
  }
  if (props.errored) {
    return props.errorComponent;
  }
  if (!props.hasData) {
    return props.emptyComponent;
  }
  return props.dataComponent;
}

// TODO(k-fish): Remove hardcoding the grid once all the charts are in
const grid = {
  left: space(3),
  right: space(3),
  top: '25px',
  bottom: '0px',
};

function WidgetHeader(props: HeaderProps & {renderedActions: ReactNode}) {
  const {title, titleTooltip, renderedActions, subtitle} = props;
  return (
    <WidgetHeaderContainer>
      <TitleContainer>
        <StyledHeaderTitleLegend>
          {title}
          <QuestionTooltip position="top" size="sm" title={titleTooltip} />
        </StyledHeaderTitleLegend>
        <div />
        {subtitle ? subtitle : null}
      </TitleContainer>

      {renderedActions && (
        <HeaderActionsContainer>{renderedActions}</HeaderActionsContainer>
      )}
    </WidgetHeaderContainer>
  );
}

const StyledHeaderTitleLegend = styled(HeaderTitleLegend)`
  position: relative;
  z-index: initial;
`;

const TitleContainer = styled('div')`
  display: flex;
  flex-direction: column;
`;

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
      <Button borderless size={'zero'}>
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

export function GenericPerformanceWidget(props: WidgetPropUnion) {
  switch (props.dataType) {
    case GenericPerformanceWidgetDataType.area:
      return <AreaWidget {...props} />;
    case GenericPerformanceWidgetDataType.histogram:
      return <HistogramWidget {...props} />;
    case GenericPerformanceWidgetDataType.vitals:
      return <VitalsWidget {...props} />;
    default:
      throw new Error('Missing support for data type');
  }
}

function _AreaWidget(props: AreaWidgetProps & {router: InjectedRouter}) {
  const {chartFields, Query, Chart, HeaderActions, chartHeight, router, containerType} =
    props;
  return (
    <Query yAxis={chartFields}>
      {results => {
        const loading = results.loading;
        const errored = results.errored;
        const data: Series[] = results.timeseriesData as Series[];

        const start = null;

        const end = null;
        const utc = false;
        const statsPeriod = '14d';

        const Container = getPerformanceWidgetContainer({
          containerType,
        });

        const childData = {
          loading,
          errored,
          data,
          start,
          end,
          utc,
          statsPeriod,
          router,
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
                hasData={!!(data && data.length)}
                errorComponent={<DefaultErrorComponent chartHeight={chartHeight} />}
                dataComponent={<Chart {...childData} grid={grid} height={chartHeight} />}
                emptyComponent={<Placeholder height={`${chartHeight}px`} />}
              />
            </ContentContainer>
          </Container>
        );
      }}
    </Query>
  );
}
const AreaWidget = withRouter(_AreaWidget);

function _VitalsWidget(
  props: VitalsWidgetProps & {
    router: InjectedRouter;
    location: Location;
    organization: Organization;
    theme: Theme;
  }
) {
  const {
    chartFields,
    Query,
    location,
    Chart,
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
                    showDetail={true}
                    showBar={false}
                  />
                }
              />
              <DataStateSwitch
                {...childData}
                hasData={!!(data && data.length)}
                errorComponent={<DefaultErrorComponent chartHeight={chartHeight} />}
                dataComponent={<Chart {...childData} grid={grid} height={chartHeight} />}
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
  const {chartFields, Query, Chart, HeaderActions, chartHeight, containerType} = props;
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
                errorComponent={<DefaultErrorComponent chartHeight={chartHeight} />}
                dataComponent={
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

const DefaultErrorComponent = (props: {chartHeight: number}) => {
  return (
    <ErrorPanel height={`${props.chartHeight}px`}>
      <IconWarning color="gray300" size="lg" />
    </ErrorPanel>
  );
};

GenericPerformanceWidget.defaultProps = {
  containerType: 'panel',
  chartHeight: 200,
};
