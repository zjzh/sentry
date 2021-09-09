import {ComponentProps} from 'react';
import {Location} from 'history';
import omit from 'lodash/omit';

import EventsRequest from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import withApi from 'app/utils/withApi';
import DurationChart from 'app/views/performance/charts/chart';

import {GenericPerformanceWidget, transformAreaResults} from './genericPerformanceWidget';
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
  const queryProps = {...omit(props, 'field'), orgSlug: props.organization.slug};

  return (
    <GenericPerformanceWidget
      {...props}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[props.field]}
      HeaderActions={provided => (
        <WidgetContainerActions {...provided} setChartSetting={props.setChartSetting} />
      )}
      Queries={{
        chart: {
          component: provided => (
            <WrappedEventsRequest
              {...provided}
              {...queryProps}
              yAxis={provided.fields}
              limit={1}
              includePrevious
              includeTransformedData
              partial
              query={props.eventView.getQueryWithAdditionalConditions()}
              period={statsPeriod ?? undefined}
              interval={interval ?? ''}
            />
          ),
          transform: transformAreaResults,
        },
      }}
      Visualizations={{
        chart: {
          component: provided => (
            <DurationChart
              {...provided}
              start={start ?? ''}
              end={end ?? ''}
              utc={utc === 'true'} // TODO(k-fish): Fix this.
              grid={{
                left: space(0),
                right: space(0),
                top: space(2),
                bottom: space(0),
              }}
              disableMultiAxis
            />
          ),
          height: 160,
        },
      }}
    />
  );
}

const WrappedEventsRequest = withApi(EventsRequest);
