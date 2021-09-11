import {Fragment} from 'react';
import {withRouter} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import _EventsRequest from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import withApi from 'app/utils/withApi';
import _DurationChart from 'app/views/performance/charts/chart';

import {GenericPerformanceWidget} from './components/performanceWidget';
import {transformEventsRequestToArea} from './transforms/transformEventsToArea';
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
  setChartSetting: (setting: performanceWidgetSetting) => void;
};

export function SingleFieldAreaWidget(props: Props) {
  const {interval, statsPeriod} = getParams(props.location.query);
  const queryProps = {...omit(props, 'field'), orgSlug: props.organization.slug};

  if (props.fields.length !== 1) {
    throw new Error(`Single field area can only accept a single field (${props.fields})`);
  }

  return (
    <GenericPerformanceWidget
      {...props}
      subtitle={<Subtitle>{t('Compared to last %s ', statsPeriod)}</Subtitle>}
      dataType={GenericPerformanceWidgetDataType.area}
      fields={[...props.fields]}
      HeaderActions={provided => (
        <Fragment>
          <HighlightNumber color={props.chartColor}>
            {provided.widgetData.chart?.dataMean?.[0].label}
          </HighlightNumber>
          <WidgetContainerActions {...provided} setChartSetting={props.setChartSetting} />
        </Fragment>
      )}
      Queries={{
        chart: {
          component: provided => (
            <EventsRequest
              {...provided}
              {...queryProps}
              yAxis={props.fields[0]}
              limit={1}
              includePrevious
              includeTransformedData
              partial
              currentSeriesName={props.fields[0]}
              query={props.eventView.getQueryWithAdditionalConditions()}
              period={statsPeriod ?? undefined}
              interval={interval ?? ''}
            />
          ),
          transform: transformEventsRequestToArea,
        },
      }}
      Visualizations={{
        chart: {
          component: provided => (
            <DurationChart
              {...provided}
              disableMultiAxis
              disableXAxis
              chartColors={props.chartColor ? [props.chartColor] : undefined}
            />
          ),
          height: 160,
        },
      }}
    />
  );
}

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
