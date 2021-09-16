import {Fragment, useEffect} from 'react';

import {QueryDefinitionWithKey, QueryHandlerProps, WidgetDataConstraint} from '../types';

/*
  Component to handle switching component-style queries over to state. This will temporarily make things easier to switch away from waterfall style api fetches.
*/
export function QueryHandler<T extends WidgetDataConstraint>(
  props: QueryHandlerProps<T>
) {
  if (!props.queries.length) {
    return <div>{props.children}</div>;
  }
  const [query, ...remainingQueries] = props.queries;
  if (typeof query.enabled !== 'undefined' && !query.enabled) {
    return <QueryHandler {...props} queries={remainingQueries} />;
  }
  return (
    <query.component fields={query.fields} yAxis={query.fields}>
      {results => {
        return (
          <Fragment>
            <QueryResultSaver<T> results={results} {...props} query={query} />
            <QueryHandler<T> {...props} queries={remainingQueries} />
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
