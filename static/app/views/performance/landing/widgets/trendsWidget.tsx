import {Fragment} from 'react';
import {withRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import _EventsRequest from 'app/components/charts/eventsRequest';
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
import {getCurrentTrendFunction, getSelectedTransaction} from '../../trends/utils';

import {GenericPerformanceWidget} from './components/performanceWidget';
import {transformTrendsDiscover} from './transforms/transformTrendsDiscover';
import {
  GenericPerformanceWidgetDataType,
  PerformanceWidgetSetting,
  WidgetDataResult,
} from './types';
import {WidgetContainerActions} from './widgetContainer';

type Props = {
  title: string;
  titleTooltip: string;
  fields: string[];
  chartColor?: string;

  eventView: EventView;
  location: Location;
  organization: Organization;

  trendChangeType: TrendChangeType;

  setChartSetting: (setting: PerformanceWidgetSetting) => void;
};

type TrendsWidgetDataType = {
  chart: WidgetDataResult & ReturnType<typeof transformTrendsDiscover>;
};

export function TrendsWidget(props: Props) {
  const {eventView: _eventView, location, organization, trendChangeType} = props;
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

  return (
    <GenericPerformanceWidget<TrendsWidgetDataType>
      {...rest}
      subtitle={<Subtitle>{t('Trending Transactions')}</Subtitle>}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[...rest.fields]}
      HeaderActions={provided => (
        <Fragment>
          <WidgetContainerActions
            {...provided.widgetData.chart}
            setChartSetting={props.setChartSetting}
          />
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
      Visualizations={[
        {
          component: provided => (
            <TrendsChart
              {...provided}
              isLoading={provided.widgetData.chart.isLoading}
              statsData={provided.widgetData.chart.statsData}
              query={eventView.query}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
              transaction={getSelectedTransaction(
                location,
                trendChangeType,
                provided.widgetData.chart.events
              )}
              {...rest}
            />
          ),
          bottomPadding: true,
          height: 160,
        },
        {
          noPadding: true,
          component: provided => {
            // const transaction = getSelectedTransaction(
            //   location,
            //   trendChangeType,
            //   provided.events
            // );
            const transactionsList = provided.widgetData.chart?.transactionsList;

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
                    statsData={provided.widgetData.chart.statsData}
                    handleSelectTransaction={() => {}}
                  />
                ))}
              </Fragment>
            );
          },
          height: 160,
        },
      ]}
    />
  );
}

const TrendsChart = withProjects(withRouter(withApi(withTheme(Chart))));
const ListItem = withProjects(withApi(TrendsListItem));
const Subtitle = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
`;
