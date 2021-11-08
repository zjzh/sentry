import * as React from 'react';
import {browserHistory} from 'react-router';
import {components, OptionProps} from 'react-select';
import {css} from '@emotion/react';
import styled from '@emotion/styled';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {validateIssueWidget} from 'app/actionCreators/dashboards';
import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {ModalRenderProps} from 'app/actionCreators/modal';
import {Client} from 'app/api';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import IssueWidgetQueriesForm from 'app/components/dashboards/issueWidgetQueriesForm';
import SelectControl from 'app/components/forms/selectControl';
import {PanelAlert} from 'app/components/panels';
import {t, tct} from 'app/locale';
import space from 'app/styles/space';
import {
  DateString,
  GlobalSelection,
  Organization,
  RelativePeriod,
  SelectValue,
} from 'app/types';
import trackAdvancedAnalyticsEvent from 'app/utils/analytics/trackAdvancedAnalyticsEvent';
import withApi from 'app/utils/withApi';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import IssueWidgetCard from 'app/views/dashboardsV2/issueWidgetCard';
import {
  DashboardDetails,
  DashboardListItem,
  DisplayType,
  MAX_WIDGETS,
  Widget,
  WidgetQuery,
  WidgetType,
} from 'app/views/dashboardsV2/types';
import {mapErrors} from 'app/views/dashboardsV2/widget/eventWidget/utils';
import Input from 'app/views/settings/components/forms/controls/input';
import Field from 'app/views/settings/components/forms/field';

import Tooltip from '../tooltip';

export type DashboardIssueWidgetModalOptions = {
  organization: Organization;
  dashboard?: DashboardDetails;
  selection?: GlobalSelection;
  onAddWidget?: (data: Widget) => void;
  widget?: Widget;
  onUpdateWidget?: (nextWidget: Widget) => void;
  start?: DateString;
  end?: DateString;
  statsPeriod?: RelativePeriod | string;
};

type Props = ModalRenderProps &
  DashboardIssueWidgetModalOptions & {
    api: Client;
    organization: Organization;
    selection: GlobalSelection;
  };

type FlatValidationError = {
  [key: string]: string | FlatValidationError[] | FlatValidationError;
};

type State = {
  title: string;
  interval: Widget['interval'];
  queries: WidgetQuery[];
  loading: boolean;
  errors?: Record<string, any>;
  dashboards: DashboardListItem[];
  selectedDashboard?: SelectValue<string>;
  userHasModified: boolean;
};

const newQuery = {
  name: '',
  fields: ['count()'],
  conditions: '',
  orderby: '',
};
class AddDashboardIssueWidgetModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const {widget} = props;
    if (!widget) {
      this.state = {
        title: '',
        interval: '5m',
        queries: [{...newQuery}],
        errors: undefined,
        loading: false,
        dashboards: [],
        userHasModified: false,
      };
      return;
    }

    this.state = {
      title: widget.title,
      interval: widget.interval,
      queries: widget.queries,
      errors: undefined,
      loading: false,
      dashboards: [],
      userHasModified: false,
    };
  }

  handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const {
      api,
      organization,
      onAddWidget,
      onUpdateWidget,
      widget: previousWidget,
    } = this.props;
    this.setState({loading: true});
    let errors: FlatValidationError = {};
    const widgetData: Widget = {
      title: this.state.title,
      interval: this.state.interval,
      queries: this.state.queries,
      displayType: DisplayType.TABLE,
      type: WidgetType.ISSUE,
    };
    // Only Table and Top N views need orderby
    if (![DisplayType.TABLE, DisplayType.TOP_N].includes(widgetData.displayType)) {
      widgetData.queries[0].orderby = '';
    }
    try {
      await validateIssueWidget(api, organization.slug, widgetData);
      if (typeof onUpdateWidget === 'function' && !!previousWidget) {
        onUpdateWidget({
          id: previousWidget?.id,
          ...widgetData,
        });
        addSuccessMessage(t('Updated widget.'));
      } else if (onAddWidget) {
        onAddWidget(widgetData);
        addSuccessMessage(t('Added widget.'));
      }
    } catch (err) {
      errors = mapErrors(err?.responseJSON ?? {}, {});
      this.setState({errors});
    } finally {
      this.setState({loading: false});
    }
  };

  handleSubmitFromDiscover = async (errors: FlatValidationError, widgetData: Widget) => {
    const {closeModal, organization} = this.props;
    const {selectedDashboard, dashboards} = this.state;
    // Validate that a dashboard was selected since api call to /dashboards/widgets/ does not check for dashboard
    if (
      !selectedDashboard ||
      !(
        dashboards.find(({title, id}) => {
          return title === selectedDashboard?.label && id === selectedDashboard?.value;
        }) || selectedDashboard.value === 'new'
      )
    ) {
      errors.dashboard = t('This field may not be blank');
      this.setState({errors});
    }
    if (!Object.keys(errors).length && selectedDashboard) {
      closeModal();

      const queryData: {
        queryNames: string[];
        queryConditions: string[];
        queryFields: string[];
        queryOrderby: string;
      } = {
        queryNames: [],
        queryConditions: [],
        queryFields: widgetData.queries[0]?.fields,
        queryOrderby: widgetData.queries[0]?.orderby,
      };
      queryData.queryNames.push(widgetData.queries[0]?.name);
      queryData.queryConditions.push(widgetData.queries[0]?.conditions);
      const pathQuery = {
        displayType: widgetData.displayType,
        interval: widgetData.interval,
        title: widgetData.title,
        ...queryData,
      };

      trackAdvancedAnalyticsEvent('discover_views.add_to_dashboard.confirm', {
        organization,
      });

      if (selectedDashboard.value === 'new') {
        browserHistory.push({
          pathname: `/organizations/${organization.slug}/dashboards/new/`,
          query: pathQuery,
        });
      } else {
        browserHistory.push({
          pathname: `/organizations/${organization.slug}/dashboard/${selectedDashboard.value}/`,
          query: pathQuery,
        });
      }
    }
  };

  handleFieldChange = (field: string) => (value: string) => {
    const {organization} = this.props;
    this.setState(prevState => {
      const newState = cloneDeep(prevState);
      set(newState, field, value);

      trackAdvancedAnalyticsEvent('dashboards_views.add_widget_modal.change', {
        from: 'dashboards',
        field,
        value,
        organization,
      });

      return {...newState, errors: undefined};
    });
  };

  handleQueryChange = (widgetQuery: WidgetQuery) => {
    this.setState(prevState => {
      const newState = cloneDeep(prevState);
      set(newState, `queries`, [widgetQuery]);
      set(newState, 'userHasModified', true);

      return {...newState, errors: undefined};
    });
  };

  async fetchDashboards() {
    const {api, organization} = this.props;
    const promise: Promise<DashboardListItem[]> = api.requestPromise(
      `/organizations/${organization.slug}/dashboards/`,
      {
        method: 'GET',
        query: {sort: 'myDashboardsAndRecentlyViewed'},
      }
    );

    try {
      const dashboards = await promise;
      this.setState({
        dashboards,
      });
    } catch (error) {
      const errorResponse = error?.responseJSON ?? null;
      if (errorResponse) {
        addErrorMessage(errorResponse);
      } else {
        addErrorMessage(t('Unable to fetch dashboards'));
      }
    }
    this.setState({loading: false});
  }

  handleDashboardChange(option: SelectValue<string>) {
    this.setState({selectedDashboard: option});
  }

  renderDashboardSelector() {
    const {errors, loading, dashboards} = this.state;
    const dashboardOptions = dashboards.map(d => {
      return {
        label: d.title,
        value: d.id,
        isDisabled: d.widgetDisplay.length >= MAX_WIDGETS,
      };
    });
    return (
      <React.Fragment>
        <p>
          {t(
            `Choose which dashboard you'd like to add this query to. It will appear as a widget.`
          )}
        </p>
        <Field
          label={t('Custom Dashboard')}
          inline={false}
          flexibleControlStateSize
          stacked
          error={errors?.dashboard}
          style={{marginBottom: space(1), position: 'relative'}}
          required
        >
          <SelectControl
            name="dashboard"
            options={[
              {label: t('+ Create New Dashboard'), value: 'new'},
              ...dashboardOptions,
            ]}
            onChange={(option: SelectValue<string>) => this.handleDashboardChange(option)}
            disabled={loading}
            components={{
              Option: ({label, data, ...optionProps}: OptionProps<any>) => (
                <Tooltip
                  disabled={!!!data.isDisabled}
                  title={tct('Max widgets ([maxWidgets]) per dashboard reached.', {
                    maxWidgets: MAX_WIDGETS,
                  })}
                  containerDisplayMode="block"
                  position="right"
                >
                  <components.Option
                    label={label}
                    data={data}
                    {...(optionProps as any)}
                  />
                </Tooltip>
              ),
            }}
          />
        </Field>
      </React.Fragment>
    );
  }

  render() {
    const {
      Footer,
      Body,
      Header,
      api,
      organization,
      selection,
      onUpdateWidget,
      widget: previousWidget,
      start,
      end,
      statsPeriod,
    } = this.props;
    const state = this.state;
    const errors = state.errors;

    // Construct GlobalSelection object using statsPeriod/start/end props so we can render widget graph using saved timeframe from Saved/Prebuilt Query
    const querySelection: GlobalSelection = statsPeriod
      ? {...selection, datetime: {start: null, end: null, period: statsPeriod, utc: null}}
      : start && end
      ? {...selection, datetime: {start, end, period: '', utc: null}}
      : selection;

    const isUpdatingWidget = typeof onUpdateWidget === 'function' && !!previousWidget;

    return (
      <React.Fragment>
        <Header closeButton>
          <h4>{isUpdatingWidget ? t('Edit Issues Widget') : t('Add Issues Widget')}</h4>
        </Header>
        <Body>
          <DoubleFieldWrapper>
            <StyledField
              data-test-id="widget-name"
              label={t('Widget Name')}
              inline={false}
              flexibleControlStateSize
              stacked
              error={errors?.title}
              required
            >
              <Input
                type="text"
                name="title"
                maxLength={255}
                required
                value={state.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.handleFieldChange('title')(event.target.value);
                }}
                disabled={state.loading}
              />
            </StyledField>
          </DoubleFieldWrapper>
          <IssueWidgetQueriesForm
            organization={organization}
            selection={querySelection}
            query={state.queries[0]}
            error={errors?.query}
            onChange={(widgetQuery: WidgetQuery) => this.handleQueryChange(widgetQuery)}
          />
          <IssueWidgetCard
            api={api}
            organization={organization}
            selection={querySelection}
            widget={{...this.state, displayType: DisplayType.TABLE}}
            isEditing={false}
            onDelete={() => undefined}
            onEdit={() => undefined}
            renderErrorMessage={errorMessage =>
              typeof errorMessage === 'string' && (
                <PanelAlert type="error">{errorMessage}</PanelAlert>
              )
            }
            isSorting={false}
            currentWidgetDragging={false}
          />
        </Body>
        <Footer>
          <ButtonBar gap={1}>
            <Button
              external
              href="https://docs.sentry.io/product/dashboards/custom-dashboards/#widget-builder"
            >
              {t('Read the docs')}
            </Button>
            <Button
              data-test-id="add-widget"
              priority="primary"
              type="button"
              onClick={this.handleSubmit}
              disabled={state.loading}
              busy={state.loading}
            >
              {isUpdatingWidget ? t('Update Widget') : t('Add Widget')}
            </Button>
          </ButtonBar>
        </Footer>
      </React.Fragment>
    );
  }
}

const DoubleFieldWrapper = styled('div')`
  display: inline-grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: ${space(1)};
  width: 100%;
`;

export const modalCss = css`
  width: 100%;
  max-width: 700px;
  margin: 70px auto;
`;

const StyledField = styled(Field)`
  position: relative;
`;

export default withApi(withGlobalSelection(AddDashboardIssueWidgetModal));
