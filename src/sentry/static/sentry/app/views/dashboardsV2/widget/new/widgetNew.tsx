import React from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';

import Breadcrumbs from 'app/components/breadcrumbs';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import * as Layout from 'app/components/layouts/thirds';
import List from 'app/components/list';
import {t} from 'app/locale';
import {PageContent} from 'app/styles/organization';
import space from 'app/styles/space';
import {GlobalSelection, Organization} from 'app/types';
import routeTitleGen from 'app/utils/routeTitle';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import AsyncView from 'app/views/asyncView';

import BuildStep from './buildStep';
import GraphData from './graphData';
import GraphVisualization from './graphVisualization';
import {AggregationOption, groupByMockOptions} from './utils';

type RouteParams = {
  orgId: string;
};

type GraphData = {
  metrics: Array<string>;
  queryTag: Array<string>;
  groupBy: string;
  aggregation: AggregationOption;
};

type Props = AsyncView['props'] &
  RouteComponentProps<RouteParams, {}> & {
    organization: Organization;
    selection: GlobalSelection;
  };

type State = AsyncView['state'] & {
  visualization: {
    type: string;
    color: string;
  };
  graphData: Array<GraphData>;
};

class WidgetNew extends AsyncView<Props, State> {
  getDefaultState() {
    return {
      ...super.getDefaultState(),

      visualization: {
        type: 'line',
        color: 'purple',
      },
      graphData: [
        {
          metrics: [],
          queryTag: [],
          groupBy: groupByMockOptions[0].value,
          aggregation: AggregationOption.AVG_BY,
        },
      ],
    };
  }

  getTitle() {
    const {params} = this.props;
    return routeTitleGen(t('Dashboards - Widget Builder'), params.orgId, false);
  }

  handleFieldChange = <F extends keyof State>(field: F, value: State[F]) => {
    this.setState(state => ({...state, [field]: value}));
  };

  handleAddGraphData = () => {
    this.setState(state => ({
      graphData: [
        ...state.graphData,
        {
          metrics: [],
          queryTag: [],
          groupBy: groupByMockOptions[0].value,
          aggregation: AggregationOption.AVG_BY,
        },
      ],
    }));
  };

  handleDeleteGraphData = (index: number) => () => {
    const newGraphData = [...this.state.graphData];
    newGraphData.splice(index, 1);

    this.setState({graphData: newGraphData});
  };

  handleChangeGraphData = <T extends keyof GraphData>(
    index: number,
    field: T,
    value: GraphData[T]
  ) => {
    const newGraphData = [...this.state.graphData];
    newGraphData[index][field] = value;
    this.setState({graphData: newGraphData});
  };

  render() {
    const {params, organization, location, selection} = this.props;
    const {visualization, graphData} = this.state;

    return (
      <StyledPageContent>
        <Layout.Header>
          <Layout.HeaderContent>
            <Breadcrumbs
              crumbs={[
                {
                  to: `/organizations/${params.orgId}/dashboards/`,
                  label: t('Dashboards'),
                },
                {label: t('Widget Builder')},
              ]}
            />
            <Layout.Title>{t('Custom Metrics Widget')}</Layout.Title>
          </Layout.HeaderContent>

          <Layout.HeaderActions>
            <ButtonBar gap={1}>
              <Button
                title={t(
                  "You’re seeing the metrics project because you have the feature flag 'organizations:metrics' enabled. Send us feedback via email."
                )}
                href="mailto:metrics-feedback@sentry.io?subject=Metrics Feedback"
              >
                {t('Give Feedback')}
              </Button>
              <Button priority="primary">{t('Save Widget')}</Button>
            </ButtonBar>
          </Layout.HeaderActions>
        </Layout.Header>

        <Layout.Body>
          <BuildSteps symbol="colored-numeric">
            <BuildStep
              title={t('Graph your data')}
              description={t('Configure your chart by adding query data')}
            >
              <GraphData
                organization={organization}
                data={graphData}
                onChange={this.handleChangeGraphData}
                onAdd={this.handleAddGraphData}
                onDelete={this.handleDeleteGraphData}
              />
            </BuildStep>
            <BuildStep
              title={t('Choose your visualization')}
              description={t(
                'This is a preview of how your widget will appear in the dashboard.'
              )}
            >
              <GraphVisualization
                onChange={this.handleFieldChange}
                visualization={visualization}
                organization={organization}
                selection={selection}
                api={this.api}
                location={location}
              />
            </BuildStep>
          </BuildSteps>
        </Layout.Body>
      </StyledPageContent>
    );
  }
}

export default withGlobalSelection(WidgetNew);

const StyledPageContent = styled(PageContent)`
  padding: 0;
`;

const BuildSteps = styled(List)`
  display: grid;
  grid-gap: ${space(3)};
`;
