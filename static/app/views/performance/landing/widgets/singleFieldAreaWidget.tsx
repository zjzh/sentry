import {Location} from 'history';

import EventsRequest from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import withApi from 'app/utils/withApi';
import DurationChart from 'app/views/performance/charts/chart';

import {GenericPerformanceWidget} from './genericPerformanceWidget';
import {GenericPerformanceWidgetDataType} from './types';
import {performanceWidgetSetting, WidgetContainerActions} from './widgetContainer';

type Props = {
  title: string;
  titleTooltip: string;
  field: string;

  eventView: EventView;
  location: Location;
  organization: Organization;
  setChartSetting: (setting: performanceWidgetSetting) => void;
};

export function SingleFieldAreaWidget(props: Props) {
  const {start, end, utc, interval, statsPeriod} = getParams(props.location.query);
  const queryProps = {...props, orgSlug: props.organization.slug};

  return (
    <GenericPerformanceWidget
      {...props}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[props.field]}
      HeaderActions={provided => (
        <WidgetContainerActions
          {...provided}
          organization={props.organization}
          setChartSetting={props.setChartSetting}
        />
      )}
      Queries={{
        chart: provided => (
          <WrappedEventsRequest
            {...provided}
            {...queryProps}
            query={props.eventView.getQueryWithAdditionalConditions()}
            period={statsPeriod ?? undefined}
            interval={interval ?? ''}
            limit={1}
            includePrevious
            includeTransformedData
            partial
          />
        ),
      }}
      Visualizations={{
        chart: provided => (
          <DurationChart
            {...provided}
            start={start ?? ''}
            end={end ?? ''}
            utc={utc === 'true'} // TODO(k-fish): Fix this.
            grid={{
              left: space(0),
              right: space(3),
              top: space(2),
              bottom: '0px',
            }}
            disableMultiAxis
          />
        ),
      }}
    />
  );
}

const WrappedEventsRequest = withApi(EventsRequest);
