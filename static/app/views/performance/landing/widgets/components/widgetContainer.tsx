import {useState} from 'react';
import styled from '@emotion/styled';

import MenuItem from 'app/components/menuItem';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import localStorage from 'app/utils/localStorage';
import {useOrganization} from 'app/utils/useOrganization';
import withOrganization from 'app/utils/withOrganization';
import ContextMenu from 'app/views/dashboardsV2/contextMenu';

import {getTermHelp, PERFORMANCE_TERM} from '../../../data';
import {TrendChangeType} from '../../../trends/types';
import {GenericPerformanceWidgetDataType, PerformanceWidgetSetting} from '../types';
import {SingleFieldAreaWidget} from '../widgets/singleFieldAreaWidget';
import {TrendsWidget} from '../widgets/trendsWidget';

import {ChartRowProps} from './miniChartRow';

type Props = {
  index: number;
  organization: Organization;
  defaultChartSetting: PerformanceWidgetSetting;
  chartHeight: number;
  chartColor?: string;
} & ChartRowProps;

type ForwardedProps = Omit<
  Props,
  'organization' | 'chartSetting' | 'index' | 'chartHeight'
> & {
  orgSlug: string;
};

interface BaseChartSetting {
  dataType: GenericPerformanceWidgetDataType;
  title: string;

  titleTooltip: string;
  fields: string[];

  // Area
  chartColor?: string;
}

const getContainerLocalStorageKey = (index: number, height: number) =>
  `landing-chart-container#${height}#${index}`;
const getChartSetting = (
  index: number,
  height: number,
  defaultType: PerformanceWidgetSetting
): PerformanceWidgetSetting => {
  const key = getContainerLocalStorageKey(index, height);
  const value = localStorage.getItem(key);
  if (
    value &&
    Object.values(PerformanceWidgetSetting).includes(value as PerformanceWidgetSetting)
  ) {
    const _value: PerformanceWidgetSetting = value as PerformanceWidgetSetting;
    return _value;
  }
  return defaultType;
};
const _setChartSetting = (
  index: number,
  height: number,
  setting: PerformanceWidgetSetting
) => {
  const key = getContainerLocalStorageKey(index, height);
  localStorage.setItem(key, setting);
};

const WIDGET_SETTINGS: ({
  organization: Organization,
}) => Record<PerformanceWidgetSetting, BaseChartSetting> = ({
  organization,
}: {
  organization: Organization;
}) => ({
  [PerformanceWidgetSetting.LCP_HISTOGRAM]: {
    title: t('LCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    fields: ['measurements.lcp'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [PerformanceWidgetSetting.FCP_HISTOGRAM]: {
    title: t('FCP Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    fields: ['measurements.fcp'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [PerformanceWidgetSetting.FID_HISTOGRAM]: {
    title: t('FID Distribution'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.DURATION_DISTRIBUTION),
    fields: ['measurements.fid'],
    dataType: GenericPerformanceWidgetDataType.histogram,
  },
  [PerformanceWidgetSetting.WORST_LCP_VITALS]: {
    title: t('Worst LCP Web Vitals'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.LCP),
    fields: [
      'count_if(measurements.lcp,greaterOrEquals,4000)',
      'count_if(measurements.lcp,greaterOrEquals,2500)',
      'count_if(measurements.lcp,greaterOrEquals,0)',
      'equation|count_if(measurements.lcp,greaterOrEquals,2500) - count_if(measurements.lcp,greaterOrEquals,4000)',
      'equation|count_if(measurements.lcp,greaterOrEquals,0) - count_if(measurements.lcp,greaterOrEquals,2500)',
    ],
    dataType: GenericPerformanceWidgetDataType.vitals,
  },
  [PerformanceWidgetSetting.TPM_AREA]: {
    title: t('Transactions Per Minute'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.TPM),
    fields: ['tpm()'],
    dataType: GenericPerformanceWidgetDataType.area,
  },
  [PerformanceWidgetSetting.FAILURE_RATE_AREA]: {
    title: t('Failure Rate'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.FAILURE_RATE),
    fields: ['failure_rate()'],
    dataType: GenericPerformanceWidgetDataType.area,
  },
  [PerformanceWidgetSetting.USER_MISERY_AREA]: {
    title: t('User Misery'),
    titleTooltip: getTermHelp(organization, PERFORMANCE_TERM.USER_MISERY),
    fields: [`user_misery(${organization.apdexThreshold})`],
    dataType: GenericPerformanceWidgetDataType.area,
  },
  [PerformanceWidgetSetting.MOST_IMPROVED]: {
    title: t('Most Improved'),
    titleTooltip: t(
      'This compares the baseline (%s) of the past with the present.',
      'improved'
    ),
    fields: [],
    dataType: GenericPerformanceWidgetDataType.trends,
  },
  [PerformanceWidgetSetting.MOST_REGRESSED]: {
    title: t('Most Regressed'),
    titleTooltip: t(
      'This compares the baseline (%s) of the past with the present.',
      'regressed'
    ),
    fields: [],
    dataType: GenericPerformanceWidgetDataType.trends,
  },
});

const _WidgetContainer = (props: Props) => {
  const {organization, index, chartHeight, ...rest} = props;
  const _chartSetting = getChartSetting(index, chartHeight, rest.defaultChartSetting);
  const [chartSetting, setChartSettingState] = useState(_chartSetting);

  const setChartSetting = (setting: PerformanceWidgetSetting) => {
    _setChartSetting(index, chartHeight, setting);
    setChartSettingState(setting);
  };
  // const onFilterChange = () => {};

  const chartSettings = WIDGET_SETTINGS({organization})[chartSetting];
  if (chartSettings) {
    if (chartSettings.dataType === GenericPerformanceWidgetDataType.trends) {
      return (
        <TrendsWidget
          {...props}
          {...chartSettings}
          trendChangeType={
            chartSetting === PerformanceWidgetSetting.MOST_IMPROVED
              ? TrendChangeType.IMPROVED
              : TrendChangeType.REGRESSION
          }
          setChartSetting={setChartSetting}
        />
      );
    }
    return (
      <SingleFieldAreaWidget
        {...props}
        {...chartSettings}
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
  setChartSetting,
}: {
  loading: boolean;
  setChartSetting: (setting: PerformanceWidgetSetting) => void;
}) => {
  const organization = useOrganization();
  const menuOptions: React.ReactNode[] = [];

  const settingsMap = WIDGET_SETTINGS({organization});
  for (const _setting in PerformanceWidgetSetting) {
    const setting: PerformanceWidgetSetting = PerformanceWidgetSetting[
      _setting
    ] as PerformanceWidgetSetting;

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
