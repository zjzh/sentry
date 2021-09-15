import {Fragment} from 'react';
import {withRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import _EventsRequest from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import TrendsDiscoverQuery from 'app/utils/performance/trends/trendsDiscoverQuery';
import withApi from 'app/utils/withApi';
import withProjects from 'app/utils/withProjects';
import _DurationChart from 'app/views/performance/charts/chart';

import {TrendsListItem} from '../../trends/changedTransactions';
import {Chart} from '../../trends/chart';
import {TrendChangeType} from '../../trends/types';
import {
  getCurrentTrendFunction,
  getCurrentTrendParameter,
  getSelectedTransaction,
} from '../../trends/utils';

import {GenericPerformanceWidget} from './components/performanceWidget';
import {transformTrendsDiscover} from './transforms/transformTrendsDiscover';
import {GenericPerformanceWidgetDataType} from './types';
import {performanceWidgetSetting, WidgetContainerActions} from './widgetContainer';

type Props = {
  title: string;
  titleTooltip: string;
  fields: string[];
  chartColor?: string;

  eventView: EventView;
  location: Location;
  organization: Organization;

  trendChangeType: TrendChangeType;

  setChartSetting: (setting: performanceWidgetSetting) => void;
};

export function TrendsWidget(props: Props) {
  const {eventView: _eventView, location, fields, organization, trendChangeType} = props;
  const {interval, statsPeriod} = getParams(location.query);
  const eventView = _eventView.clone();
  eventView.fields = [{field: 'transaction'}, {field: 'project'}];
  eventView.sorts = [
    {
      kind: trendChangeType === TrendChangeType.IMPROVED ? 'asc' : 'desc',
      field: 'trend_percentage()',
    },
  ];
  const rest = {eventView, ...omit(props, 'eventView')};
  const queryProps = {...omit(rest, 'field'), orgSlug: organization.slug};
  eventView.additionalConditions.addFilterValues('tpm()', ['>0.01']);
  eventView.additionalConditions.addFilterValues('count_percentage()', ['>0.25', '<4']);
  eventView.additionalConditions.addFilterValues('trend_percentage()', ['>0%']);
  eventView.additionalConditions.addFilterValues('confidence()', ['>6']);
  eventView.additionalConditions.removeFilter('transaction.op'); // Get rid of pageload for testing.

  const trendFunction = getCurrentTrendFunction(location);
  const trendParameter = getCurrentTrendParameter(location);

  return (
    <GenericPerformanceWidget
      {...rest}
      subtitle={<Subtitle>{t('Trending Transactions')}</Subtitle>}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[...rest.fields]}
      HeaderActions={provided => (
        <Fragment>
          <WidgetContainerActions {...provided} setChartSetting={props.setChartSetting} />
        </Fragment>
      )}
      Queries={{
        chart: {
          component: provided => (
            <TrendsDiscoverQuery
              {...provided}
              {...queryProps}
              trendChangeType={props.trendChangeType}
              limit={3}
            />
          ),
          transform: transformTrendsDiscover,
        },
      }}
      Visualizations={{
        chart: {
          component: provided => (
            <TrendsChart
              {...provided}
              query={eventView.query}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
              transaction={getSelectedTransaction(
                location,
                trendChangeType,
                provided.events
              )}
              {...rest}
            />
          ),
          bottomPadding: true,
          height: 160,
        },
        table: {
          noPadding: true,
          component: provided => {
            // const transaction = getSelectedTransaction(
            //   location,
            //   trendChangeType,
            //   provided.events
            // );
            const transactionsList = provided.widgetData.chart.transactionsList;

            return (
              <Fragment>
                {(transactionsList ?? []).map((transaction, index) => (
                  <ListItem
                    currentTrendFunction={trendFunction.field}
                    currentTrendColumn={trendFunction.alias}
                    trendView={eventView}
                    organization={organization}
                    transaction={transaction}
                    key={transaction.transaction}
                    index={index}
                    trendChangeType={trendChangeType}
                    transactions={transactionsList}
                    location={location}
                    statsData={provided.statsData}
                    handleSelectTransaction={() => {}}
                  />
                ))}
              </Fragment>
            );
          },
          height: 160,
        },
      }}
    />
  );
}

const TrendsChart = withTheme(Chart);
const ListItem = withProjects(withApi(TrendsListItem));
const EventsRequest = withApi(_EventsRequest);
const DurationChart = withRouter(_DurationChart);
const Subtitle = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
`;

const HighlightNumber = styled('div')<{color?: string}>`
  color: ${p => p.color};
  font-size: ${p => p.theme.fontSizeExtraLarge};
`;
