import EventsRequest from 'app/components/charts/eventsRequest';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import withApi from 'app/utils/withApi';
import DurationChart from 'app/views/performance/charts/chart';

import {GenericPerformanceWidget} from './genericPerformanceWidget';
import {GenericPerformanceWidgetDataType} from './types';

type Props = {
  title: string;
  titleTooltip: string;
  chartField: string;

  eventView: EventView;
  organization: Organization;
};

export function SingleFieldAreaWidget(props: Props) {
  const {start, end} = props.eventView;
  const queryProps = {...props, orgSlug: props.organization.slug};
  const otherQueryProps = {
    interval: '1d',
    limit: 1,
    includeTransformedData: true,
    query: '',
  };
  return (
    <GenericPerformanceWidget
      {...props}
      dataType={GenericPerformanceWidgetDataType.area}
      chartFields={[props.chartField]}
      Query={provided => (
        <WrappedEventsRequest
          {...provided}
          {...queryProps}
          {...otherQueryProps}
          includePrevious
          partial
        />
      )}
      Chart={provided => (
        <DurationChart
          {...provided}
          start={start ?? ''}
          end={end ?? ''}
          utc={false} // TODO(k-fish): Fix this.
          disableMultiAxis
        />
      )}
    />
  );
}

const WrappedEventsRequest = withApi(EventsRequest);
