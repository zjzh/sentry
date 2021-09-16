import {ChildrenProps} from 'app/utils/performance/trends/trendsDiscoverQuery';
import {normalizeTrends} from 'app/views/performance/trends/utils';

export function transformTrendsDiscover(_: any, props: ChildrenProps) {
  const {trendsData} = props;
  const events = normalizeTrends(
    (trendsData && trendsData.events && trendsData.events.data) || []
  );
  return {
    ...props,
    data: trendsData,
    hasData: !!trendsData?.events.data.length,
    loading: props.isLoading,
    isLoading: props.isLoading,
    isErrored: !!props.error,
    errored: props.error,
    statsData: trendsData ? trendsData.stats : {}, // TODO(k-fish): Fix loading visualizations only when these props are defined
    transactionsList: events && events.slice ? events.slice(0, 3) : [],
    events,
  };
}
