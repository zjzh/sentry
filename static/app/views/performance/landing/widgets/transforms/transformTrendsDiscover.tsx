import {ChildrenProps} from 'app/utils/performance/trends/trendsDiscoverQuery';
import {normalizeTrends} from 'app/views/performance/trends/utils';

export function transformTrendsDiscover(widgetProps: {}, props: ChildrenProps) {
  const {trendsData} = props;
  const events = normalizeTrends(
    (trendsData && trendsData.events && trendsData.events.data) || []
  );
  return {
    ...props,
    data: trendsData,
    hasData: trendsData?.events.data.length,
    loading: props.isLoading,
    errored: props.error,
    statsData: trendsData?.stats,
    transactionsList: events && events.slice ? events.slice(0, 3) : [],
    events,
  };
}
