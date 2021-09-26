import {usePageError} from 'app/utils/performance/contexts/pageError';

import Table from '../../table';
import {DoubleChartRow, MiniChartRow} from '../widgets/components/miniChartRow';
import {PerformanceWidgetSetting} from '../widgets/widgetDefinitions';

import {BasePerformanceViewProps} from './types';

export function AllTransactionsView(props: BasePerformanceViewProps) {
  return (
    <div>
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
      {/* Existing chart network call: https://sentry.io/api/0/organizations/sentry/events-stats/?interval=5m&partial=1&project=11276&query=transaction.duration%3A%3C15m%20event.type%3Atransaction&statsPeriod=24h&yAxis=apdex%28%29&yAxis=tpm%28%29 */}
      <Table {...props} setError={usePageError().setPageError} />
    </div>
  );
}
