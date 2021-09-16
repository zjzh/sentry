import {Fragment, useEffect} from 'react';

import {
  QueryDefinitionWithKey,
  QueryHandlerProps,
  WidgetDataConstraint,
  WidgetDataResult,
} from '../types';

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
    <query.component>
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
    results: WidgetDataResult | undefined;
    query: QueryDefinitionWithKey<T>;
  } & QueryHandlerProps<T>
) {
  const {results, query} = props;
  if (results) {
    useEffect(() => {
      props.setWidgetDataForKey(
        query.queryKey,
        query.transform(props.queryProps, results)
      );
    }, [results.hasData, results.isLoading, results.isErrored]);
  }
  return <Fragment />;
}
