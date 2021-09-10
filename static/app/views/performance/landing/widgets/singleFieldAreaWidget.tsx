import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import _EventsRequest from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import withApi from 'app/utils/withApi';
import DurationChart from 'app/views/performance/charts/chart';

import {
  GenericPerformanceWidget,
  transformAreaResults,
  WidgetDataProps,
} from './genericPerformanceWidget';
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
} & WidgetDataProps;

export function SingleFieldAreaWidget(props: Props) {
  const {interval, statsPeriod} = getParams(props.location.query);
  const queryProps = {...omit(props, 'field'), orgSlug: props.organization.slug};

  return (
    <GenericPerformanceWidget
      {...props}
      subtitle={<Subtitle>{t('Compared to last %s ', statsPeriod)}</Subtitle>}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[props.field]}
      HeaderActions={provided => (
        <WidgetContainerActions {...provided} setChartSetting={props.setChartSetting} />
      )}
      Queries={{
        chart: {
          component: provided => (
            <EventsRequest
              {...provided}
              {...queryProps}
              yAxis={props.field}
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
          enabled: data => true,
        },
      }}
      Visualizations={{
        chart: {
          component: provided => (
            <DurationChart
              {...provided}
              disableMultiAxis
              disableXAxis
              grid={{containLabel: false, top: 0, bottom: 0, left: 0, right: 0}}
            />
          ),
          height: 160,
        },
      }}
    />
  );
}

const EventsRequest = withApi(_EventsRequest);
const Subtitle = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
`;
