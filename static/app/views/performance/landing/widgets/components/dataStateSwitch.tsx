import {Fragment} from 'react';

export function DataStateSwitch(props: {
  loading: boolean;
  errored: boolean;
  hasData: boolean;

  loadingComponent?: JSX.Element;
  errorComponent: JSX.Element;
  dataComponents: JSX.Element[];
  emptyComponent: JSX.Element;
}): JSX.Element {
  if (props.loading && props.loadingComponent) {
    return props.loadingComponent;
  }
  if (props.errored) {
    return props.errorComponent;
  }
  if (!props.hasData) {
    return props.emptyComponent;
  }
  return <Fragment>{props.dataComponents}</Fragment>;
}
