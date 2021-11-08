import * as React from 'react';
import isEqual from 'lodash/isEqual';
import * as qs from 'query-string';

import {Client} from 'app/api';
import {isSelectionEqual} from 'app/components/organizations/globalSelectionHeader/utils';
import {GlobalSelection, OrganizationSummary} from 'app/types';
import {getUtcDateString} from 'app/utils/dates';
import {TableDataWithTitle} from 'app/utils/discover/discoverQuery';
import {IssueDisplayOptions, IssueSortOptions} from 'app/views/issueList/utils';

import {Widget, WidgetQuery} from './types';

const MAX_ITEMS = 5;
const DEFAULT_SORT = IssueSortOptions.DATE;
const DEFAULT_DISPLAY = IssueDisplayOptions.EVENTS;

type EndpointParams = Partial<GlobalSelection['datetime']> & {
  project: number[];
  environment: string[];
  query?: string;
  sort?: string;
  statsPeriod?: string;
  groupStatsPeriod?: string;
  cursor?: string;
  page?: number | string;
  display?: string;
};

type Props = {
  api: Client;
  organization: OrganizationSummary;
  widget: Widget;
  selection: GlobalSelection;
  children: (
    props: Pick<State, 'loading' | 'tableResults' | 'errorMessage'>
  ) => React.ReactNode;
};

type State = {
  errorMessage: undefined | string;
  loading: boolean;
  queryFetchID: symbol | undefined;
  rawResults: undefined | RawResult[];
  tableResults: undefined | TableDataWithTitle[];
};

class WidgetQueries extends React.Component<Props, State> {
  state: State = {
    loading: true,
    queryFetchID: undefined,
    errorMessage: undefined,
    rawResults: undefined,
    tableResults: undefined,
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props) {
    const {selection, widget} = this.props;

    // We do not fetch data whenever the query name changes.
    // Also don't count empty fields when checking for field changes
    const [prevWidgetQueries] = prevProps.widget.queries
      .map((query: WidgetQuery) => {
        query.fields = query.fields.filter(field => !!field);
        return query;
      })
      .reduce(
        ([names, queries]: [string[], Omit<WidgetQuery, 'name'>[]], {name, ...rest}) => {
          names.push(name);
          queries.push(rest);
          return [names, queries];
        },
        [[], []]
      );

    const [widgetQueries] = widget.queries
      .map((query: WidgetQuery) => {
        query.fields = query.fields.filter(field => !!field && field !== 'equation|');
        return query;
      })
      .reduce(
        ([names, queries]: [string[], Omit<WidgetQuery, 'name'>[]], {name, ...rest}) => {
          names.push(name);
          queries.push(rest);
          return [names, queries];
        },
        [[], []]
      );

    if (
      !isEqual(widget.displayType, prevProps.widget.displayType) ||
      !isEqual(widget.interval, prevProps.widget.interval) ||
      !isEqual(widgetQueries, prevWidgetQueries) ||
      !isEqual(widget.displayType, prevProps.widget.displayType) ||
      !isSelectionEqual(selection, prevProps.selection)
    ) {
      this.fetchData();
      return;
    }
  }

  fetchEventData() {
    const {selection, api, organization, widget} = this.props;

    // Table, world map, and stat widgets use table results and need
    // to do a discover 'table' query instead of a 'timeseries' query.
    this.setState({tableResults: []});

    // Issue Widgets only support single queries
    const query = widget.queries[0];
    let groupListUrl: string = '';
    // let groupStatUrl: string = '';
    if (widget.displayType === 'table') {
      groupListUrl = `/organizations/${organization.slug}/issues/`;
      // groupStatUrl = `/organizations/${organization.slug}/issues-stats/`;
    } else {
      throw Error('Expected widget displayType to be table');
    }
    const params: EndpointParams = {
      project: selection.projects,
      environment: selection.environments,
      query: query.conditions,
      sort: DEFAULT_SORT,
      display: DEFAULT_DISPLAY,
    };

    if (selection.datetime.period) {
      params.statsPeriod = selection.datetime.period;
    }
    if (selection.datetime.end) {
      params.end = getUtcDateString(params.end);
    }
    if (selection.datetime.start) {
      params.start = getUtcDateString(params.start);
    }
    if (selection.datetime.utc) {
      params.utc = selection.datetime.utc;
    }

    const groupListPromise = api.requestPromise(groupListUrl, {
      method: 'GET',
      data: qs.stringify({
        ...params,
        limit: MAX_ITEMS,
      }),
    });

    const promises = [groupListPromise];

    const completed = 0;
    promises.forEach(async promise => {
      const data = await promise;
      this.setState({loading: false, errorMessage: undefined, tableResults: data});
    });
  }

  fetchData() {
    this.setState({loading: true, errorMessage: undefined});
    this.fetchEventData();
  }

  render() {
    const {children} = this.props;
    const {loading, tableResults, errorMessage} = this.state;

    return children({loading, tableResults, errorMessage});
  }
}

export default WidgetQueries;
