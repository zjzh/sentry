import {useState} from 'react';
import styled from '@emotion/styled';

import EventsRequest from 'app/components/charts/eventsRequest';
import MenuItem from 'app/components/menuItem';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import {getUtcToLocalDateObject} from 'app/utils/dates';
import localStorage from 'app/utils/localStorage';
import HistogramQuery from 'app/utils/performance/histogram/histogramQuery';
import withApi from 'app/utils/withApi';
import withOrganization from 'app/utils/withOrganization';
import ContextMenu from 'app/views/dashboardsV2/contextMenu';
import DurationChart from 'app/views/performance/charts/chart';

import {getTermHelp, PERFORMANCE_TERM} from '../../data';
import {Chart as _HistogramChart} from '../chart/histogramChart';

import {
  GenericPerformanceWidget,
  GenericPerformanceWidgetDataType,
} from './genericPerformanceWidget';
import {ChartRowProps} from './miniChartRow';

type Props = {
  index: number;
  organization: Organization;
  defaultChartSetting: ChartSettingType;
  chartHeight: number;
} & ChartRowProps;

type ForwardedProps = Omit<
  Props,
  'organization' | 'chartSetting' | 'index' | 'chartHeight'
> & {
  orgSlug: string;
};

export enum ChartSettingType {
  LCP_HISTOGRAM = 'lcp_histogram',
  FCP_HISTOGRAM = 'fcp_histogram',
  FID_HISTOGRAM = 'fid_histogram',
  TPM_AREA = 'tpm_area',
}

interface ChartSetting {
  title: string;
  titleTooltip: string;
  chartField: string;
  dataType: GenericPerformanceWidgetDataType;
}

const getContainerLocalStorageKey = (index: number, height: number) =>
  `landing-chart-container#${height}#${index}`;
const getChartSetting = (
  index: number,
  height: number,
  defaultType: ChartSettingType
): ChartSettingType => {
  const key = getContainerLocalStorageKey(index, height);
  const value = localStorage.getItem(key);
  if (value && Object.values(ChartSettingType).includes(value as ChartSettingType)) {
    const _value: ChartSettingType = value as ChartSettingType;
    return _value;
  }
  return defaultType;
};
const _setChartSetting = (index: number, height: number, setting: ChartSettingType) => {
  const key = getContainerLocalStorageKey(index, height);
  localStorage.setItem(key, setting);
};

const CHART_SETTING_OPTIONS: ({
  organization: Organization,
}) => Record<ChartSettingType, ChartSetting> = ({
  organization,
}: {
  organization: Organization;
}) => ({
  [ChartSettingType.LCP_HISTOGRAM]: {
    title: t('LCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartField: 'measurements.lcp',
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [ChartSettingType.FCP_HISTOGRAM]: {
    title: t('FCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartField: 'measurements.fcp',
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [ChartSettingType.FID_HISTOGRAM]: {
    title: t('FID Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartField: 'measurements.fid',
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [ChartSettingType.TPM_AREA]: {
    title: t('Transactions Per Minute'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.TPM),
    chartField: 'tpm()',
    dataType: GenericPerformanceWidgetDataType.area,
  },
});

const _WidgetChartContainer = ({organization, index, chartHeight, ...rest}: Props) => {
  const _chartSetting = getChartSetting(index, chartHeight, rest.defaultChartSetting);
  const [chartSetting, setChartSettingState] = useState(_chartSetting);

  const setChartSetting = (setting: ChartSettingType) => {
    _setChartSetting(index, chartHeight, setting);
    setChartSettingState(setting);
  };
  const onFilterChange = () => {};

  const chartSettingOptions = CHART_SETTING_OPTIONS({organization})[chartSetting];

  const queryProps: ForwardedProps = {
    ...rest,
    orgSlug: organization.slug,
  };

  if (chartSettingOptions.dataType === GenericPerformanceWidgetDataType.histogram) {
    return (
      <GenericPerformanceWidget
        chartHeight={chartHeight}
        {...chartSettingOptions}
        HeaderActions={provided => (
          <ChartContainerActions
            {...provided}
            {...rest}
            organization={organization}
            setChartSetting={setChartSetting}
          />
        )}
        Query={provided => (
          <HistogramQuery {...provided} {...queryProps} numBuckets={20} />
        )}
        Chart={provided => (
          <HistogramChart {...provided} onFilterChange={onFilterChange} />
        )}
      />
    );
  } else {
    const {eventView, location} = rest;
    const globalSelection = eventView.getGlobalSelection();
    const start = globalSelection.datetime.start
      ? getUtcToLocalDateObject(globalSelection.datetime.start)
      : null;

    const end = globalSelection.datetime.end
      ? getUtcToLocalDateObject(globalSelection.datetime.end)
      : null;

    const {utc} = getParams(location.query);

    return (
      <GenericPerformanceWidget
        chartHeight={160}
        {...chartSettingOptions}
        HeaderActions={provided => (
          <ChartContainerActions
            {...provided}
            {...rest}
            organization={organization}
            setChartSetting={setChartSetting}
          />
        )}
        Query={provided => (
          <WrappedEventsRequest
            organization={organization}
            {...provided}
            {...queryProps}
            numBuckets={20}
          />
        )}
        Chart={provided => (
          <DurationChart
            {...provided}
            start={start}
            end={end}
            utc={utc === 'true'}
            onFilterChange={onFilterChange}
            disableMultiAxis
          />
        )}
      />
    );
  }
};

const WrappedEventsRequest = withApi(EventsRequest);

const ChartContainerActions = ({
  organization,
  setChartSetting,
}: {
  loading: boolean;
  organization: Organization;
  setChartSetting: (setting: ChartSettingType) => void;
}) => {
  const menuOptions: React.ReactNode[] = [];

  const settingsMap = CHART_SETTING_OPTIONS({organization});
  for (const _setting in ChartSettingType) {
    const setting: ChartSettingType = ChartSettingType[_setting] as ChartSettingType;

    const options = settingsMap[setting];
    menuOptions.push(
      <MenuItem key={_setting} onClick={() => setChartSetting(setting)}>
        {t(options.title)}
      </MenuItem>
    );
  }

  return (
    <ChartActionContainer>
      <ContextMenu>{menuOptions}</ContextMenu>
    </ChartActionContainer>
  );
};

const ChartActionContainer = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const HistogramChart = styled(_HistogramChart)`
  & .Container {
    padding-bottom: 0px;
  }
`;

const WidgetChartContainer = withOrganization(_WidgetChartContainer);

export default WidgetChartContainer;
