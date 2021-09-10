import {Fragment, useEffect} from 'react';

function QueryHandler(props: QueryHandlerProps) {
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
            <QueryResultSaver results={results} {...props} query={query} />
            <QueryHandler {...props} queries={remainingQueries} />
          </Fragment>
        );
      }}
    </query.component>
  );
}

function QueryResultSaver(
  props: {
    results: CommonPerformanceQueryData;
    query: QueryDefinitionWithKey;
  } & QueryHandlerProps
) {
  const {results, query} = props;
  useEffect(() => {
    props.setWidgetDataForKey(query.queryKey, query.transform(props.queryProps, results));
  }, [results.data, results.loading, results.errored]);
  return <Fragment />;
}
