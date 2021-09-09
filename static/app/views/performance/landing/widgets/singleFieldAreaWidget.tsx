import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import EventsRequest from 'app/components/charts/eventsRequest';
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
            <WrappedEventsRequest
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
        },
      }}
      Visualizations={{
        chart: {
          component: provided => <DurationChart {...provided} disableMultiAxis />,
          height: 160,
        },
      }}
    />
  );
}

const WrappedEventsRequest = withApi(EventsRequest);
const Subtitle = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
`;
