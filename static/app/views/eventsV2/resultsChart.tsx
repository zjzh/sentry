import {Component, Fragment} from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import isEqual from 'lodash/isEqual';

import {Client} from 'app/api';
import EventsChart from 'app/components/charts/eventsChart';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {Panel} from 'app/components/panels';
import Placeholder from 'app/components/placeholder';
import {Organization} from 'app/types';
import {getUtcToLocalDateObject} from 'app/utils/dates';
import EventView from 'app/utils/discover/eventView';
import {DisplayModes, TOP_N} from 'app/utils/discover/types';
import getDynamicText from 'app/utils/getDynamicText';
import {decodeScalar} from 'app/utils/queryString';
import withApi from 'app/utils/withApi';

import ChartFooter from './chartFooter';

const datasets = [
  {label: 'Safari Outage', value: 'safari'},
  {label: 'Fastly CDN', value: 'fastly_cdn'},
  {label: 'Fastly CDN No Moving Average', value: 'fastly_cdn_no_mavg'},
];

const levels = [
  {label: 'High', value: 'high'},
  {label: 'Medium', value: 'medium'},
  {label: 'Low', value: 'low'},
];

function getSelectedDataset(
  location: Location
): 'safari' | 'fastly_cdn' | 'fastly_cdn_no_mavg' {
  const dataset = String(location.query.dataset ?? 'safari');
  switch (dataset) {
    case 'fastly_cdn':
    case 'fastly_cdn_no_mavg':
      return dataset;
    case 'safari':
    default:
      return 'safari';
  }
}

function getSelectedLevel(location: Location, key: string): 'low' | 'medium' | 'high' {
  const level = String(location.query[key] ?? 'medium');
  switch (level) {
    case 'low':
    case 'high':
      return level;
    case 'medium':
    default:
      return 'medium';
  }
}

type ResultsChartProps = {
  api: Client;
  router: ReactRouter.InjectedRouter;
  organization: Organization;
  eventView: EventView;
  location: Location;
  confirmedQuery: boolean;
};

class ResultsChart extends Component<ResultsChartProps> {
  shouldComponentUpdate(nextProps: ResultsChartProps) {
    const {eventView, ...restProps} = this.props;
    const {eventView: nextEventView, ...restNextProps} = nextProps;

    if (!eventView.isEqualTo(nextEventView)) {
      return true;
    }

    return !isEqual(restProps, restNextProps);
  }

  render() {
    const {api, eventView, location, organization, router, confirmedQuery} = this.props;

    const yAxisValue = eventView.getYAxis();

    const globalSelection = eventView.getGlobalSelection();
    const start = globalSelection.datetime.start
      ? getUtcToLocalDateObject(globalSelection.datetime.start)
      : null;

    const end = globalSelection.datetime.end
      ? getUtcToLocalDateObject(globalSelection.datetime.end)
      : null;

    const {utc} = getParams(location.query);
    const apiPayload = eventView.getEventsAPIPayload(location);
    const display = eventView.getDisplayMode();
    const isTopEvents =
      display === DisplayModes.TOP5 || display === DisplayModes.DAILYTOP5;
    const isPeriod = display === DisplayModes.DEFAULT || display === DisplayModes.TOP5;
    const isDaily = display === DisplayModes.DAILYTOP5 || display === DisplayModes.DAILY;
    const isPrevious = display === DisplayModes.PREVIOUS;
    const isAnomaly = display === DisplayModes.ANOMALY;
    const dataset = getSelectedDataset(location);
    const sensitivity = getSelectedLevel(location, 'sensitivity');
    const smoothing = getSelectedLevel(location, 'smoothing');

    return (
      <Fragment>
        {getDynamicText({
          value: (
            <EventsChart
              api={api}
              router={router}
              query={apiPayload.query}
              organization={organization}
              showLegend
              yAxis={yAxisValue}
              projects={globalSelection.projects}
              environments={globalSelection.environments}
              start={start}
              end={end}
              period={globalSelection.datetime.period}
              disablePrevious={!isPrevious}
              disableReleases={!isPeriod}
              field={isTopEvents ? apiPayload.field : undefined}
              interval={eventView.interval}
              showDaily={isDaily}
              topEvents={isTopEvents ? TOP_N : undefined}
              orderby={isTopEvents ? decodeScalar(apiPayload.sort) : undefined}
              utc={utc === 'true'}
              confirmedQuery={confirmedQuery}
              showAnomaly={isAnomaly}
              anomalySensitivity={sensitivity}
              anomalySmoothing={smoothing}
              anomalyDataset={dataset}
            />
          ),
          fixed: <Placeholder height="200px" testId="skeleton-ui" />,
        })}
      </Fragment>
    );
  }
}

type ContainerProps = {
  api: Client;
  router: ReactRouter.InjectedRouter;
  eventView: EventView;
  location: Location;
  organization: Organization;
  confirmedQuery: boolean;

  // chart footer props
  total: number | null;
  onAxisChange: (value: string) => void;
  onDisplayChange: (value: string) => void;
};

class ResultsChartContainer extends Component<ContainerProps> {
  shouldComponentUpdate(nextProps: ContainerProps) {
    const {eventView, ...restProps} = this.props;
    const {eventView: nextEventView, ...restNextProps} = nextProps;

    if (
      !eventView.isEqualTo(nextEventView) ||
      this.props.confirmedQuery !== nextProps.confirmedQuery
    ) {
      return true;
    }

    return !isEqual(restProps, restNextProps);
  }

  render() {
    const {
      api,
      eventView,
      location,
      router,
      total,
      onAxisChange,
      onDisplayChange,
      organization,
      confirmedQuery,
    } = this.props;

    const yAxisValue = eventView.getYAxis();
    const hasQueryFeature = organization.features.includes('discover-query');
    const displayOptions = eventView.getDisplayOptions().filter(opt => {
      // top5 modes are only available with larger packages in saas.
      // We remove instead of disable here as showing tooltips in dropdown
      // menus is clunky.
      if (
        [DisplayModes.TOP5, DisplayModes.DAILYTOP5].includes(opt.value as DisplayModes) &&
        !hasQueryFeature
      ) {
        return false;
      }
      return true;
    });

    const selectedDataset = getSelectedDataset(location);
    const selectedSensitivity = getSelectedLevel(location, 'sensitivity');
    const selectedSmoothing = getSelectedLevel(location, 'smoothing');

    function handleOnChange(key: string) {
      return value => {
        ReactRouter.browserHistory.push({
          ...location,
          query: {
            ...location.query,
            [key]: value,
          },
        });
      };
    }

    function handleDatasetChange(value: string) {
      const query: any = {
        query: location.query.query,
      };
      if (value === 'safari') {
        query.query = 'event.type:transaction browser.name:Safari';
        query.project = 11276; // javascript project id
        query.start = '2021-06-07T00:00:00';
        query.end = '2021-06-19T23:59:59';
      } else if (value === 'fastly_cdn' || value === 'fastly_cdn_no_mavg') {
        query.query = 'event.type:transaction';
        query.project = 11276; // javascript project id
        query.start = '2021-06-23T00:00:00';
        query.end = '2021-07-06T23:59:59';
      }

      ReactRouter.browserHistory.push({
        ...location,
        query: {
          ...location.query,
          ...query,
          dataset: value,
        },
      });
    }

    return (
      <StyledPanel>
        <ResultsChart
          api={api}
          eventView={eventView}
          location={location}
          organization={organization}
          router={router}
          confirmedQuery={confirmedQuery}
        />
        <ChartFooter
          total={total}
          yAxisValue={yAxisValue}
          yAxisOptions={eventView.getYAxisOptions()}
          onAxisChange={onAxisChange}
          displayOptions={displayOptions}
          displayMode={eventView.getDisplayMode()}
          onDisplayChange={onDisplayChange}
          sensitivity={selectedSensitivity}
          sensitivityOptions={levels}
          onSensitivityChange={handleOnChange('sensitivity')}
          smoothing={selectedSmoothing}
          smoothingOptions={levels}
          onSmoothingChange={handleOnChange('smoothing')}
          dataset={selectedDataset}
          datasetOptions={datasets}
          onDatasetChange={handleDatasetChange}
        />
      </StyledPanel>
    );
  }
}

export default withApi(ResultsChartContainer);

export const StyledPanel = styled(Panel)`
  @media (min-width: ${p => p.theme.breakpoints[1]}) {
    margin: 0;
  }
`;
