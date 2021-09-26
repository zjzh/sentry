import {Fragment, useEffect} from 'react';

import {getUtcToLocalDateObject} from 'app/utils/dates';

import {QueryDefinitionWithKey, QueryHandlerProps, WidgetDataConstraint} from '../types';

/*
  Component to handle switching component-style queries over to state. This will temporarily make things easier to switch away from waterfall style api components.
*/
export function QueryHandler<T extends WidgetDataConstraint>(
  props: QueryHandlerProps<T>
) {
  const children = props.children ?? <Fragment />;
  if (!props.queries.length) {
    return <Fragment>{children}</Fragment>;
  }
  const [query, ...remainingQueries] = props.queries;
  if (typeof query.enabled !== 'undefined' && !query.enabled) {
    return <QueryHandler {...props} queries={remainingQueries} />;
  }

  const globalSelection = props.queryProps.eventView.getGlobalSelection();
  const start = globalSelection.datetime.start
    ? getUtcToLocalDateObject(globalSelection.datetime.start)
    : null;

  const end = globalSelection.datetime.end
    ? getUtcToLocalDateObject(globalSelection.datetime.end)
    : null;

  return (
    <query.component
      fields={query.fields}
      yAxis={query.fields}
      start={start}
      end={end}
      period={globalSelection.datetime.period}
      project={globalSelection.projects}
      environment={globalSelection.environments}
      organization={props.queryProps.organization}
    >
      {results => {
        return (
          <Fragment>
            <QueryHandler<T> {...props} queries={remainingQueries} />
            <QueryResultSaver<T> results={results} {...props} query={query} />
          </Fragment>
        );
      }}
    </query.component>
  );
}

function QueryResultSaver<T extends WidgetDataConstraint>(
  props: {
    results: any; // TODO(k-fish): Fix this any.
    query: QueryDefinitionWithKey<T>;
  } & QueryHandlerProps<T>
) {
  const {results, query} = props;
  const transformed = query.transform(props.queryProps, results, props.query);

  useEffect(() => {
    props.setWidgetDataForKey(query.queryKey, transformed);
  }, [transformed?.hasData, transformed?.isLoading, transformed?.isErrored]);
  return <Fragment />;
}
