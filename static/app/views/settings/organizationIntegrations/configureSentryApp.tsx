import {Fragment} from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';

import NavTabs from 'app/components/navTabs';
import {t} from 'app/locale';
import {
  IntegrationProvider,
  IntegrationWithConfig,
  Organization,
  SentryApp,
} from 'app/types';

import withOrganization from 'app/utils/withOrganization';
import AsyncView from 'app/views/asyncView';

import SettingsPageHeader from 'app/views/settings/components/settingsPageHeader';
import FieldFromConfig from 'app/views/settings/components/forms/fieldFromConfig';
import {Field} from 'app/views/settings/components/forms/type';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';

type RouteParams = {
  sentryAppSlug: string;
  installationId: string;
};
type Props = RouteComponentProps<RouteParams, {}> & {
  organization: Organization;
};

type Tab = string;

type FieldFromSchema = Omit<Field, 'choices' | 'type'> & {
  type: 'toggle';
  default?: string;
  uri?: string;
  depends_on?: string[];
  choices?: Array<[any, string]>;
  async?: boolean;
};

type State = AsyncView['state'] & {
  config: {providers: IntegrationProvider[]};
  integration: IntegrationWithConfig;
  tab?: Tab;
  sentryApp: SentryApp;
  sentryAppComponents: any[];
};
class ConfigureSentryApp extends AsyncView<Props, State> {
  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const {organization} = this.props;
    const {sentryAppSlug} = this.props.params;

    return [
      ['sentryApp', `/sentry-apps/${sentryAppSlug}/`],
      [
        'sentryAppComponents',
        `/organizations/${organization.slug}/sentry-app-components/?filter=configuration-settings`,
      ],
    ];
  }

  onLoadAllEndpointsSuccess() {
    const {sentryAppComponents} = this.state;
    const settings = sentryAppComponents.find(
      component => component.type === 'configuration-settings'
    );
    const {schema} = settings;
    this.setState({tab: schema['title']});
  }

  onTabChange = (value: Tab) => {
    this.setState({tab: value});
  };

  get tab() {
    return this.state.tab;
  }

  renderBody() {
    const {sentryApp} = this.state;

    const header = <SettingsPageHeader noTitleStyles title={sentryApp.name} />;

    return (
      <Fragment>
        {header}
        {this.renderMainContent()}
      </Fragment>
    );
  }

  renderField = (field: FieldFromSchema) => {
    // This function converts the field we get from the backend into
    // the field we need to pass down
    let fieldToPass: Field = {
      ...field,
      inline: true,
      stacked: false,
      flexibleControlStateSize: true,
    };

    // if we have a uri, we need to set extra parameters
    const extraProps = {};
    console.log({
      key: field.name,
      field: fieldToPass,
      test: field.name,
      ...extraProps,
    });
    return (
      <FieldFromConfig
        key={field.name}
        field={fieldToPass}
        data-test-id={field.name}
        onBlur={this.handleFieldChange}
        {...extraProps}
      />
    );
  };

  handleFieldChange = async (value, event) => {
    const {sentryAppComponents} = this.state;
    const {installationId} = this.props.params;
    const newState = cloneDeep(sentryAppComponents);
    const settingsIndex = newState.findIndex(
      component => component.type === 'configuration-settings'
    );
    const elementIndex = newState[settingsIndex]['schema']['elements'].findIndex(
      el => el.name === event.target.name
    );
    set(
      newState,
      `[${settingsIndex}]["schema"]["elements"][${elementIndex}]["value"]`,
      value
    );
    await this.api
      .requestPromise(
        `/sentry-app-installations/${installationId}/configuration-settings/`,
        {
          method: 'POST',
          data: {
            uri: sentryAppComponents[settingsIndex]['schema']['uri'],
            [event.target.name]: value,
          },
        }
      )
      .then(
        () => {
          this.setState({sentryAppComponents: newState}, () =>
            addSuccessMessage(
              t(
                '%s changed to %s.',
                newState[settingsIndex]['schema']['elements'][elementIndex]['label'],
                value
              )
            )
          );
        },
        () => {
          addErrorMessage(
            t(
              'Failed to change %s to %s.',
              newState[settingsIndex]['schema']['elements'][elementIndex]['label'],
              value
            )
          );
        }
      );
  };

  // renders everything below header
  renderMainContent() {
    const {sentryAppComponents} = this.state;

    const settings = sentryAppComponents.find(
      component => component.type === 'configuration-settings'
    );
    const {schema} = settings;

    const tabs = [[schema.title, schema.title]];

    return (
      <Fragment>
        <NavTabs underlined>
          {tabs.map(tabTuple => (
            <li
              key={tabTuple[0]}
              className={this.tab === tabTuple[0] ? 'active' : ''}
              onClick={() => this.onTabChange(tabTuple[0] as Tab)}
            >
              <CapitalizedLink>{tabTuple[1]}</CapitalizedLink>
            </li>
          ))}
        </NavTabs>
        {schema.elements.map(element => {
          return this.renderField(element);
        })}
      </Fragment>
    );
  }
}

export default withOrganization(ConfigureSentryApp);

const CapitalizedLink = styled('a')`
  text-transform: capitalize;
`;
