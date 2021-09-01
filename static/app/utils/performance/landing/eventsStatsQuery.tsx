import * as React from 'react';

import {MetaType} from 'app/utils/discover/eventView';
import GenericDiscoverQuery, {
  DiscoverQueryProps,
  GenericChildrenProps,
} from 'app/utils/discover/genericDiscoverQuery';
import withApi from 'app/utils/withApi';
import {TransactionThresholdMetric} from 'app/views/performance/transactionSummary/transactionThresholdModal';

/**
 * An individual row in a DiscoverQuery result
 */
export type TableDataRow = {
  id: string;
  [key: string]: React.ReactText;
};

/**
 * A DiscoverQuery result including rows and metadata.
 */
export type TableData = {
  data: Array<TableDataRow>;
  meta?: MetaType;
};

export type DiscoverQueryPropsWithThresholds = DiscoverQueryProps & {
  transactionName?: string;
  transactionThreshold?: number;
  transactionThresholdMetric?: TransactionThresholdMetric;
};

type DiscoverQueryChildrenProps = GenericChildrenProps<DiscoverQueryPropsWithThresholds>;
export type DiscoverQueryChildren = {
  children: (props: DiscoverQueryChildrenProps) => React.ReactNode;
};

function shouldRefetchData(
  prevProps: DiscoverQueryPropsWithThresholds,
  nextProps: DiscoverQueryPropsWithThresholds
) {
  return (
    prevProps.transactionName !== nextProps.transactionName ||
    prevProps.transactionThreshold !== nextProps.transactionThreshold ||
    prevProps.transactionThresholdMetric !== nextProps.transactionThresholdMetric
  );
}

function EventsStatsQuery(props: DiscoverQueryPropsWithThresholds) {
  return (
    <GenericDiscoverQuery<TableData, DiscoverQueryPropsWithThresholds>
      route="events-stats"
      shouldRefetchData={shouldRefetchData}
      {...props}
    />
  );
}

export default withApi(EventsStatsQuery);
