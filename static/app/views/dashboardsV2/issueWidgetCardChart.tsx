import * as React from 'react';
import {InjectedRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';
import isEqual from 'lodash/isEqual';

import ErrorPanel from 'app/components/charts/errorPanel';
import SimpleTableChart from 'app/components/charts/simpleTableChart';
import TransitionChart from 'app/components/charts/transitionChart';
import TransparentLoadingMask from 'app/components/charts/transparentLoadingMask';
import LoadingIndicator from 'app/components/loadingIndicator';
import Placeholder from 'app/components/placeholder';
import {IconWarning} from 'app/icons';
import space from 'app/styles/space';
import {GlobalSelection, Organization} from 'app/types';
import {Theme} from 'app/utils/theme';

import {Widget} from './types';
import WidgetQueries from './widgetQueries';

type TableResultProps = Pick<
  WidgetQueries['state'],
  'errorMessage' | 'loading' | 'tableResults'
>;

type WidgetCardChartProps = Pick<
  WidgetQueries['state'],
  'tableResults' | 'errorMessage' | 'loading'
> & {
  theme: Theme;
  organization: Organization;
  location: Location;
  widget: Widget;
  selection: GlobalSelection;
  router: InjectedRouter;
};

class WidgetCardChart extends React.Component<WidgetCardChartProps> {
  shouldComponentUpdate(nextProps: WidgetCardChartProps): boolean {
    // Widget title changes should not update the WidgetCardChart component tree
    const currentProps = {
      ...this.props,
      widget: {
        ...this.props.widget,
        title: '',
      },
    };

    nextProps = {
      ...nextProps,
      widget: {
        ...nextProps.widget,
        title: '',
      },
    };

    return !isEqual(currentProps, nextProps);
  }

  tableResultComponent({
    loading,
    errorMessage,
    tableResults,
  }: TableResultProps): React.ReactNode {
    const {location, widget, organization} = this.props;
    if (errorMessage) {
      return (
        <ErrorPanel>
          <IconWarning color="gray500" size="lg" />
        </ErrorPanel>
      );
    }

    if (typeof tableResults === 'undefined' || loading) {
      // Align height to other charts.
      return <Placeholder height="200px" />;
    }

    console.log(tableResults);
    const fields = widget.queries[0]?.fields ?? [];
    return (
      <StyledSimpleTableChart
        key={`table:${tableResults.title}`}
        location={location}
        fields={fields}
        title={tableResults.length > 1 ? tableResults.title : ''}
        loading={loading}
        metadata={tableResults.meta}
        data={tableResults.data}
        organization={organization}
      />
    );
  }

  render() {
    const {tableResults, errorMessage, loading} = this.props;
    return (
      <TransitionChart loading={loading} reloading={loading}>
        <LoadingScreen loading={loading} />
        {this.tableResultComponent({tableResults, loading, errorMessage})}
      </TransitionChart>
    );
  }
}

const StyledTransparentLoadingMask = styled(props => (
  <TransparentLoadingMask {...props} maskBackgroundColor="transparent" />
))`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LoadingScreen = ({loading}: {loading: boolean}) => {
  if (!loading) {
    return null;
  }
  return (
    <StyledTransparentLoadingMask visible={loading}>
      <LoadingIndicator mini />
    </StyledTransparentLoadingMask>
  );
};

const StyledSimpleTableChart = styled(SimpleTableChart)`
  margin-top: ${space(1.5)};
  border-bottom-left-radius: ${p => p.theme.borderRadius};
  border-bottom-right-radius: ${p => p.theme.borderRadius};
  font-size: ${p => p.theme.fontSizeMedium};
  box-shadow: none;
`;

export default withTheme(WidgetCardChart);
