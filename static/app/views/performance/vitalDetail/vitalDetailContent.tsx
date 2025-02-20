import {Component, Fragment} from 'react';
import {browserHistory, InjectedRouter} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import {Client} from 'sentry/api';
import Feature from 'sentry/components/acl/feature';
import Alert from 'sentry/components/alert';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {getInterval} from 'sentry/components/charts/utils';
import {CreateAlertFromViewButton} from 'sentry/components/createAlertButton';
import SearchBar from 'sentry/components/events/searchBar';
import * as Layout from 'sentry/components/layouts/thirds';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {normalizeDateTimeParams} from 'sentry/components/organizations/pageFilters/parse';
import * as TeamKeyTransactionManager from 'sentry/components/performance/teamKeyTransactionsManager';
import {IconChevron} from 'sentry/icons';
import {IconFlag} from 'sentry/icons/iconFlag';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';
import {generateQueryWithTag} from 'sentry/utils';
import {getUtcToLocalDateObject} from 'sentry/utils/dates';
import EventView from 'sentry/utils/discover/eventView';
import {WebVital} from 'sentry/utils/discover/fields';
import MetricsRequest from 'sentry/utils/metrics/metricsRequest';
import {decodeScalar} from 'sentry/utils/queryString';
import Teams from 'sentry/utils/teams';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import withProjects from 'sentry/utils/withProjects';
import {transformMetricsToArea} from 'sentry/views/performance/landing/widgets/transforms/transformMetricsToArea';
import {PerformanceWidgetSetting} from 'sentry/views/performance/landing/widgets/widgetDefinitions';

import Breadcrumb from '../breadcrumb';
import MetricsSearchBar from '../metricsSearchBar';
import {MetricsSwitch} from '../metricsSwitch';
import {getTransactionSearchQuery} from '../utils';

import Table from './table';
import {vitalDescription, vitalMap, vitalToMetricsField} from './utils';
import VitalChart from './vitalChart';
import VitalChartMetrics from './vitalChartMetrics';
import VitalInfo from './vitalInfo';

const FRONTEND_VITALS = [WebVital.FCP, WebVital.LCP, WebVital.FID, WebVital.CLS];

type Props = {
  api: Client;
  location: Location;
  eventView: EventView;
  organization: Organization;
  projects: Project[];
  router: InjectedRouter;
  vitalName: WebVital;
  isMetricsData: boolean;
};

type State = {
  incompatibleAlertNotice: React.ReactNode;
  error: string | undefined;
};

function getSummaryConditions(query: string) {
  const parsed = new MutableSearch(query);
  parsed.freeText = [];

  return parsed.formatString();
}

class VitalDetailContent extends Component<Props, State> {
  state: State = {
    incompatibleAlertNotice: null,
    error: undefined,
  };

  handleSearch = (query: string) => {
    const {location} = this.props;

    const queryParams = normalizeDateTimeParams({
      ...(location.query || {}),
      query,
    });

    // do not propagate pagination when making a new search
    const searchQueryParams = omit(queryParams, 'cursor');

    browserHistory.push({
      pathname: location.pathname,
      query: searchQueryParams,
    });
  };

  generateTagUrl = (key: string, value: string) => {
    const {location} = this.props;
    const query = generateQueryWithTag(location.query, {key, value});

    return {
      ...location,
      query,
    };
  };

  handleIncompatibleQuery: React.ComponentProps<
    typeof CreateAlertFromViewButton
  >['onIncompatibleQuery'] = (incompatibleAlertNoticeFn, _errors) => {
    const incompatibleAlertNotice = incompatibleAlertNoticeFn(() =>
      this.setState({incompatibleAlertNotice: null})
    );
    this.setState({incompatibleAlertNotice});
  };

  renderCreateAlertButton() {
    const {eventView, organization, projects} = this.props;

    return (
      <CreateAlertFromViewButton
        eventView={eventView}
        organization={organization}
        projects={projects}
        onIncompatibleQuery={this.handleIncompatibleQuery}
        onSuccess={() => {}}
        referrer="performance"
      />
    );
  }

  renderVitalSwitcher() {
    const {vitalName, location} = this.props;

    const position = FRONTEND_VITALS.indexOf(vitalName);

    if (position < 0) {
      return null;
    }

    const previousDisabled = position === 0;
    const nextDisabled = position === FRONTEND_VITALS.length - 1;

    const switchVital = newVitalName => {
      return () => {
        browserHistory.push({
          pathname: location.pathname,
          query: {
            ...location.query,
            vitalName: newVitalName,
          },
        });
      };
    };

    return (
      <ButtonBar merged>
        <Button
          icon={<IconChevron direction="left" size="sm" />}
          aria-label={t('Previous')}
          disabled={previousDisabled}
          onClick={switchVital(FRONTEND_VITALS[position - 1])}
        />
        <Button
          icon={<IconChevron direction="right" size="sm" />}
          aria-label={t('Next')}
          disabled={nextDisabled}
          onClick={switchVital(FRONTEND_VITALS[position + 1])}
        />
      </ButtonBar>
    );
  }

  setError = (error: string | undefined) => {
    this.setState({error});
  };

  renderError() {
    const {error} = this.state;

    if (!error) {
      return null;
    }

    return (
      <Alert type="error" icon={<IconFlag size="md" />}>
        {error}
      </Alert>
    );
  }

  renderContent(vital: WebVital) {
    const {isMetricsData, location, organization, eventView, api, projects} = this.props;

    const {fields, start, end, statsPeriod, environment, project} = eventView;

    const query = decodeScalar(location.query.query, '');
    const orgSlug = organization.slug;
    const localDateStart = start ? getUtcToLocalDateObject(start) : null;
    const localDateEnd = end ? getUtcToLocalDateObject(end) : null;
    const interval = getInterval(
      {start: localDateStart, end: localDateEnd, period: statsPeriod},
      'high'
    );

    if (isMetricsData) {
      const field = `p75(${vitalToMetricsField[vital]})`;

      return (
        <Fragment>
          <StyledMetricsSearchBar
            searchSource="performance_vitals_metrics"
            orgSlug={orgSlug}
            projectIds={project}
            query={query}
            onSearch={this.handleSearch}
          />
          <MetricsRequest
            api={api}
            orgSlug={orgSlug}
            start={start}
            end={end}
            statsPeriod={statsPeriod}
            project={project}
            environment={environment}
            field={[field]}
            query={new MutableSearch(query).formatString()} // TODO(metrics): not all tags will be compatible with metrics
            interval={interval}
          >
            {p75RequestProps => {
              const {loading, errored, response, reloading} = p75RequestProps;

              const p75Data = transformMetricsToArea(
                {
                  location,
                  fields: [field],
                  chartSetting: PerformanceWidgetSetting.P75_DURATION_AREA,
                },
                p75RequestProps
              );

              return (
                <Fragment>
                  <VitalChartMetrics
                    start={localDateStart}
                    end={localDateEnd}
                    statsPeriod={statsPeriod}
                    project={project}
                    environment={environment}
                    loading={loading}
                    response={response}
                    errored={errored}
                    reloading={reloading}
                    field={field}
                    vital={vital}
                  />
                  <StyledVitalInfo>
                    <VitalInfo
                      orgSlug={orgSlug}
                      location={location}
                      vital={vital}
                      project={project}
                      environment={environment}
                      start={start}
                      end={end}
                      statsPeriod={statsPeriod}
                      isMetricsData={isMetricsData}
                      isLoading={loading}
                      p75AllTransactions={p75Data.dataMean?.[0].mean}
                    />
                  </StyledVitalInfo>
                  <div>TODO</div>
                </Fragment>
              );
            }}
          </MetricsRequest>
        </Fragment>
      );
    }

    const filterString = getTransactionSearchQuery(location);
    const summaryConditions = getSummaryConditions(filterString);

    return (
      <Fragment>
        <StyledSearchBar
          searchSource="performance_vitals"
          organization={organization}
          projectIds={project}
          query={query}
          fields={fields}
          onSearch={this.handleSearch}
        />
        <VitalChart
          organization={organization}
          query={query}
          project={project}
          environment={environment}
          start={localDateStart}
          end={localDateEnd}
          statsPeriod={statsPeriod}
          interval={interval}
        />
        <StyledVitalInfo>
          <VitalInfo
            orgSlug={orgSlug}
            location={location}
            vital={vital}
            project={project}
            environment={environment}
            start={start}
            end={end}
            statsPeriod={statsPeriod}
          />
        </StyledVitalInfo>

        <Teams provideUserTeams>
          {({teams, initiallyLoaded}) =>
            initiallyLoaded ? (
              <TeamKeyTransactionManager.Provider
                organization={organization}
                teams={teams}
                selectedTeams={['myteams']}
                selectedProjects={project.map(String)}
              >
                <Table
                  eventView={eventView}
                  projects={projects}
                  organization={organization}
                  location={location}
                  setError={this.setError}
                  summaryConditions={summaryConditions}
                />
              </TeamKeyTransactionManager.Provider>
            ) : (
              <LoadingIndicator />
            )
          }
        </Teams>
      </Fragment>
    );
  }

  render() {
    const {location, organization, vitalName} = this.props;
    const {incompatibleAlertNotice} = this.state;

    const vital = vitalName || WebVital.LCP;

    return (
      <Fragment>
        <Layout.Header>
          <Layout.HeaderContent>
            <Breadcrumb
              organization={organization}
              location={location}
              vitalName={vital}
            />
            <Layout.Title>{vitalMap[vital]}</Layout.Title>
          </Layout.HeaderContent>
          <Layout.HeaderActions>
            <ButtonBar gap={1}>
              <MetricsSwitch onSwitch={() => this.handleSearch('')} />
              <Feature organization={organization} features={['incidents']}>
                {({hasFeature}) => hasFeature && this.renderCreateAlertButton()}
              </Feature>
              {this.renderVitalSwitcher()}
            </ButtonBar>
          </Layout.HeaderActions>
        </Layout.Header>
        <Layout.Body>
          {this.renderError()}
          {incompatibleAlertNotice && (
            <Layout.Main fullWidth>{incompatibleAlertNotice}</Layout.Main>
          )}
          <Layout.Main fullWidth>
            <StyledDescription>{vitalDescription[vitalName]}</StyledDescription>
            {this.renderContent(vital)}
          </Layout.Main>
        </Layout.Body>
      </Fragment>
    );
  }
}

export default withProjects(VitalDetailContent);

const StyledDescription = styled('div')`
  font-size: ${p => p.theme.fontSizeMedium};
  margin-bottom: ${space(3)};
`;

const StyledSearchBar = styled(SearchBar)`
  margin-bottom: ${space(2)};
`;

const StyledVitalInfo = styled('div')`
  margin-bottom: ${space(3)};
`;

const StyledMetricsSearchBar = styled(MetricsSearchBar)`
  margin-bottom: ${space(2)};
`;
