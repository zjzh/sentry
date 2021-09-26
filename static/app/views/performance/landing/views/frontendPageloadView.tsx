import {usePageError} from 'app/utils/performance/contexts/pageError';

import Table from '../../table';
import {FRONTEND_PAGELOAD_COLUMN_TITLES} from '../data';
import {DoubleChartRow, MiniChartRow} from '../widgets/components/miniChartRow';
import {PerformanceWidgetSetting} from '../widgets/widgetDefinitions';

import {BasePerformanceViewProps} from './types';

export function FrontendPageloadView(props: BasePerformanceViewProps) {
  return (
    <div data-test-id="frontend-pageload-view">
      <MiniChartRow
        {...props}
        allowedCharts={[
          PerformanceWidgetSetting.TPM_AREA,
          PerformanceWidgetSetting.USER_MISERY_AREA,
          PerformanceWidgetSetting.FAILURE_RATE_AREA,
        ]}
      />
      <DoubleChartRow
        {...props}
        allowedCharts={[
          PerformanceWidgetSetting.MOST_IMPROVED,
          PerformanceWidgetSetting.MOST_REGRESSED,
          PerformanceWidgetSetting.TPM_AREA,
        ]}
      />

      <Table
        {...props}
        columnTitles={FRONTEND_PAGELOAD_COLUMN_TITLES}
        setError={usePageError().setPageError}
      />
    </div>
  );
}
