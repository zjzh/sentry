import {useState} from 'react';
import styled from '@emotion/styled';

import MenuItem from 'app/components/menuItem';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import localStorage from 'app/utils/localStorage';
import {useOrganization} from 'app/utils/useOrganization';
import withOrganization from 'app/utils/withOrganization';
import ContextMenu from 'app/views/dashboardsV2/contextMenu';

import {TrendChangeType} from '../../../trends/types';
import {GenericPerformanceWidgetDataType} from '../types';
import {PerformanceWidgetSetting, WIDGET_DEFINITIONS} from '../widgetDefinitions';
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

// Use local storage for chart settings for now.
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

const _WidgetContainer = (props: Props) => {
  const {organization, index, chartHeight, ...rest} = props;
  const _chartSetting = getChartSetting(index, chartHeight, rest.defaultChartSetting);
  const [chartSetting, setChartSettingState] = useState(_chartSetting);

  const setChartSetting = (setting: PerformanceWidgetSetting) => {
    _setChartSetting(index, chartHeight, setting);
    setChartSettingState(setting);
  };

  const widgetProps = {
    ...WIDGET_DEFINITIONS({organization})[chartSetting],
    ContainerActions: containerProps => (
      <WidgetContainerActions {...containerProps} setChartSetting={setChartSetting} />
    ),
  };

  switch (widgetProps.dataType) {
    case GenericPerformanceWidgetDataType.trends:
      return (
        <TrendsWidget
          {...props}
          {...widgetProps}
          trendChangeType={
            chartSetting === PerformanceWidgetSetting.MOST_IMPROVED
              ? TrendChangeType.IMPROVED
              : TrendChangeType.REGRESSION
          }
        />
      );
    case GenericPerformanceWidgetDataType.area:
      return <SingleFieldAreaWidget {...props} {...widgetProps} />;
    default:
      throw new Error(`Widget type "${widgetProps.dataType}" has no implementation.`);
  }
};

export const WidgetContainerActions = ({
  setChartSetting,
}: {
  loading: boolean;
  setChartSetting: (setting: PerformanceWidgetSetting) => void;
}) => {
  const organization = useOrganization();
  const menuOptions: React.ReactNode[] = [];

  const settingsMap = WIDGET_DEFINITIONS({organization});
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

const WidgetContainer = withOrganization(_WidgetContainer);

export default WidgetContainer;
