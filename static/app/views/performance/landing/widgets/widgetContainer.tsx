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
import {_VitalChart} from 'app/views/performance/vitalDetail/vitalChart';

import {getTermHelp, PERFORMANCE_TERM} from '../../data';
import {Chart as _HistogramChart} from '../chart/histogramChart';

import {GenericPerformanceWidget} from './genericPerformanceWidget';
import {ChartRowProps} from './miniChartRow';
import {SingleFieldAreaWidget} from './singleFieldAreaWidget';
import {GenericPerformanceWidgetDataType} from './types';

type Props = {
  index: number;
  organization: Organization;
  isNewType?: boolean;
  defaultChartSetting: performanceWidgetSetting;
  chartHeight: number;
} & ChartRowProps;

type ForwardedProps = Omit<
  Props,
  'organization' | 'chartSetting' | 'index' | 'chartHeight'
> & {
  orgSlug: string;
};

export enum performanceWidgetSetting {
  LCP_HISTOGRAM = 'lcp_histogram',
  FCP_HISTOGRAM = 'fcp_histogram',
  FID_HISTOGRAM = 'fid_histogram',
  TPM_AREA = 'tpm_area',
  WORST_LCP_VITALS = 'worst_lcp_vitals',
}

interface ChartSetting {
  title: string;
  titleTooltip: string;
  chartFields: string[];
  dataType: GenericPerformanceWidgetDataType;
}

const getContainerLocalStorageKey = (index: number, height: number) =>
  `landing-chart-container#${height}#${index}`;
const getChartSetting = (
  index: number,
  height: number,
  defaultType: performanceWidgetSetting
): performanceWidgetSetting => {
  const key = getContainerLocalStorageKey(index, height);
  const value = localStorage.getItem(key);
  if (
    value &&
    Object.values(performanceWidgetSetting).includes(value as performanceWidgetSetting)
  ) {
    const _value: performanceWidgetSetting = value as performanceWidgetSetting;
    return _value;
  }
  return defaultType;
};
const _setChartSetting = (
  index: number,
  height: number,
  setting: performanceWidgetSetting
) => {
  const key = getContainerLocalStorageKey(index, height);
  localStorage.setItem(key, setting);
};

const WIDGET_SETTING_OPTIONS: ({
  organization: Organization,
}) => Record<performanceWidgetSetting, ChartSetting> = ({
  organization,
}: {
  organization: Organization;
}) => ({
  [performanceWidgetSetting.LCP_HISTOGRAM]: {
    title: t('LCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartFields: ['measurements.lcp'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [performanceWidgetSetting.FCP_HISTOGRAM]: {
    title: t('FCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartFields: ['measurements.fcp'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [performanceWidgetSetting.FID_HISTOGRAM]: {
    title: t('FID Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    chartFields: ['measurements.fid'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [performanceWidgetSetting.TPM_AREA]: {
    title: t('Transactions Per Minute'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.TPM),
    chartFields: ['tpm()'],
    dataType: GenericPerformanceWidgetDataType.area,
  },
  [performanceWidgetSetting.WORST_LCP_VITALS]: {
    title: t('Worst LCP Web Vitals'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.LCP),
    chartFields: [
      'count_if(measurements.lcp,greaterOrEquals,4000)',
      'count_if(measurements.lcp,greaterOrEquals,2500)',
      'count_if(measurements.lcp,greaterOrEquals,0)',
      'equation|count_if(measurements.lcp,greaterOrEquals,2500) - count_if(measurements.lcp,greaterOrEquals,4000)',
      'equation|count_if(measurements.lcp,greaterOrEquals,0) - count_if(measurements.lcp,greaterOrEquals,2500)',
    ],
    dataType: GenericPerformanceWidgetDataType.vitals,
  },
});

const _WidgetContainer = (props: Props) => {
  const {organization, index, chartHeight, isNewType, ...rest} = props;
  const _chartSetting = getChartSetting(index, chartHeight, rest.defaultChartSetting);
  const [chartSetting, setChartSettingState] = useState(_chartSetting);

  const setChartSetting = (setting: performanceWidgetSetting) => {
    _setChartSetting(index, chartHeight, setting);
    setChartSettingState(setting);
  };
  // const onFilterChange = () => {};

  const chartSettingOptions = WIDGET_SETTING_OPTIONS({organization})[chartSetting];

  // const queryProps: ForwardedProps = {
  //   ...rest,
  //   orgSlug: organization.slug,
  // };

  if (isNewType) {
    return (
      <SingleFieldAreaWidget
        {...props}
        {...chartSettingOptions}
        title={t('Transactions Per Minute')}
        titleTooltip={getTermHelp(organization, PERFORMANCE_TERM.TPM)}
        field="tpm()"
        setChartSetting={setChartSetting}
      />
    );
  }

  // if (chartSettingOptions.dataType === GenericPerformanceWidgetDataType.histogram) {
  //   return (
  //     <GenericPerformanceWidget
  //       {...props}
  //       {...chartSettingOptions}
  //       HeaderActions={provided => (
  //         <WidgetContainerActions
  //           {...provided}
  //           {...rest}
  //           organization={organization}
  //           setChartSetting={setChartSetting}
  //         />
  //       )}
  //       Queries={provided => (
  //         <HistogramQuery {...provided} {...queryProps} numBuckets={20} />
  //       )}
  //       Visualizations={provided => (
  //         <HistogramChart {...provided} onFilterChange={onFilterChange} />
  //       )}
  //     />
  //   );
  // } else if (chartSettingOptions.dataType === GenericPerformanceWidgetDataType.vitals) {
  //   return (
  //     <GenericPerformanceWidget
  //       {...props}
  //       {...chartSettingOptions}
  //       HeaderActions={provided => (
  //         <WidgetContainerActions
  //           {...provided}
  //           {...rest}
  //           organization={organization}
  //           setChartSetting={setChartSetting}
  //         />
  //       )}
  //       Queries={provided => (
  //         <WrappedEventsRequest
  //           organization={organization}
  //           {...provided}
  //           {...queryProps}
  //           numBuckets={20}
  //         />
  //       )}
  //       Visualizations={provided => <_VitalChart {...provided} />}
  //     />
  //   );
  // } else {
  //   const {eventView, location} = rest;
  //   const globalSelection = eventView.getGlobalSelection();
  //   const start = globalSelection.datetime.start
  //     ? getUtcToLocalDateObject(globalSelection.datetime.start)
  //     : null;

  //   const end = globalSelection.datetime.end
  //     ? getUtcToLocalDateObject(globalSelection.datetime.end)
  //     : null;

  //   const {utc} = getParams(location.query);

  //   return (
  //     <GenericPerformanceWidget
  //       {...props}
  //       {...chartSettingOptions}
  //       HeaderActions={provided => (
  //         <WidgetContainerActions
  //           {...provided}
  //           {...rest}
  //           organization={organization}
  //           setChartSetting={setChartSetting}
  //         />
  //       )}
  //       Queries={provided => (
  //         <WrappedEventsRequest
  //           organization={organization}
  //           {...provided}
  //           {...queryProps}
  //           numBuckets={20}
  //         />
  //       )}
  //       Visualizations={provided => (
  //         <DurationChart
  //           {...provided}
  //           start={start}
  //           end={end}
  //           utc={utc === 'true'}
  //           onFilterChange={onFilterChange}
  //           disableMultiAxis
  //         />
  //       )}
  //     />
  //   );
  // }
  return <div>Error</div>;
};

// const WrappedEventsRequest = withApi(EventsRequest);

export const WidgetContainerActions = ({
  organization,
  setChartSetting,
}: {
  loading: boolean;
  organization: Organization;
  setChartSetting: (setting: performanceWidgetSetting) => void;
}) => {
  const menuOptions: React.ReactNode[] = [];

  const settingsMap = WIDGET_SETTING_OPTIONS({organization});
  for (const _setting in performanceWidgetSetting) {
    const setting: performanceWidgetSetting = performanceWidgetSetting[
      _setting
    ] as performanceWidgetSetting;

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

// const HistogramChart = styled(_HistogramChart)`
//   & .Container {
//     padding-bottom: 0px;
//   }
// `;

const WidgetContainer = withOrganization(_WidgetContainer);

export default WidgetContainer;
