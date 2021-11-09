import * as React from 'react';
import {InjectedRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';
import isEqual from 'lodash/isEqual';

import ActorAvatar from 'app/components/avatar/actorAvatar';
import ErrorPanel from 'app/components/charts/errorPanel';
import Tooltip from 'app/components/tooltip';
import TransitionChart from 'app/components/charts/transitionChart';
import TransparentLoadingMask from 'app/components/charts/transparentLoadingMask';
import EventOrGroupExtraDetails from 'app/components/eventOrGroupExtraDetails';
import EventOrGroupHeader from 'app/components/eventOrGroupHeader';
import LoadingIndicator from 'app/components/loadingIndicator';
import ExternalLink from 'app/components/links/externalLink';
import {IconUser} from 'app/icons';
import Placeholder from 'app/components/placeholder';
import ToolbarHeader from 'app/components/toolbarHeader';
import {IconWarning} from 'app/icons';
import {t, tct} from 'app/locale';
import space from 'app/styles/space';
import {GlobalSelection, Organization} from 'app/types';
import {Theme} from 'app/utils/theme';

import IssueWidgetQueries from './issueWidgetQueries';
import {Widget} from './types';

type TableResultProps = Pick<
  IssueWidgetQueries['state'],
  'errorMessage' | 'loading' | 'tableResults'
>;

type WidgetCardChartProps = Pick<
  IssueWidgetQueries['state'],
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
    const {widget, organization} = this.props;
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

    return (
      <React.Fragment>
        <StyledFlex>
          <IssueHeaderLabel>{t('Issue')}</IssueHeaderLabel>
          <AssigneesLabel className="hidden-xs hidden-sm">
            <ToolbarHeader>{t('Assignee')}</ToolbarHeader>
          </AssigneesLabel>{' '}
        </StyledFlex>
        {tableResults.map((result, index) => {
          const {assignedTo} = result;
          return (
            <StyledIssueRow key={index}>
              <GroupSummary>
                <EventOrGroupHeader
                  index={index}
                  organization={organization}
                  includeLink
                  data={result}
                  query={widget.queries[0].conditions}
                  size="normal"
                  hideIcons
                />
                <EventOrGroupExtraDetails data={result} />
              </GroupSummary>
              <EventUserWrapper>
                {assignedTo && (
                  <StyledActorAvatar
                    actor={assignedTo}
                    className="avatar"
                    size={24}
                    tooltip={
                      <TooltipWrapper>
                        {tct('Assigned to [name]', {
                          name:
                            assignedTo.type === 'team'
                              ? `#${assignedTo.name}`
                              : assignedTo.name,
                        })}
                      </TooltipWrapper>
                    }
                  />
                )}
                {!assignedTo && (
                  <Tooltip
                  isHoverable
                  skipWrapper
                  title={
                    <TooltipWrapper>
                      <div>{t('Unassigned')}</div>
                      <TooltipSubtext>
                        {tct(
                          'You can auto-assign issues by adding [issueOwners:Issue Owner rules].',
                          {
                            issueOwners: (
                              <TooltipSubExternalLink href="https://docs.sentry.io/product/error-monitoring/issue-owners/" />
                            ),
                          }
                        )}
                      </TooltipSubtext>
                    </TooltipWrapper>
                  }
                  >
                  <StyledIconUser size="20px" color="gray400" />
                  </Tooltip>
                )}
              </EventUserWrapper>
            </StyledIssueRow>
          );
        })}
      </React.Fragment>
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

const StyledIssueRow = styled('div')`
  display: flex;
  border-bottom: 1px solid rgb(231, 225, 236);
  position: relative;
  padding: 10px 0px 10px 16px;
  line-height: 1.1;
`;

const EventsOrUsersLabel = styled(ToolbarHeader)`
  display: inline-grid;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
  width: 60px;
  margin: 0 ${space(2)};

  @media (min-width: ${p => p.theme.breakpoints[3]}) {
    width: 80px;
  }
`;

const AssigneesLabel = styled('div')`
  justify-content: flex-end;
  text-align: right;
  width: 80px;
  margin-left: ${space(2)};
  margin-right: ${space(2)};
`;

const StyledFlex = styled('div')`
  display: flex;
  box-sizing: border-box;
  min-height: 45px;
  padding-top: ${space(1)};
  padding-bottom: ${space(1)};
  align-items: center;
  background: ${p => p.theme.backgroundSecondary};
  border: 1px solid ${p => p.theme.border};
  margin: 12px -1px -1px;
`;

const GroupSummary = styled('div')`
  overflow: hidden;
  flex: 1;
`;

const EventUserWrapper = styled('div')`
  display: flex;
  justify-content: flex-end;
  align-self: center;
  width: 60px;
  margin: 0 ${space(2)};

  @media (min-width: ${p => p.theme.breakpoints[3]}) {
    width: 80px;
  }
`;

const IssueHeaderLabel = styled(EventsOrUsersLabel)`
  flex: 1 1 0%;
  justify-content: left;
`;

const StyledActorAvatar = styled(ActorAvatar)`
  margin-right: 20px;
`;

const TooltipWrapper = styled('div')`
  text-align: left;
`;

const TooltipSubtext = styled('div')`
  color: ${p => p.theme.subText};
`;

const TooltipSubExternalLink = styled(ExternalLink)`
  color: ${p => p.theme.subText};
  text-decoration: underline;

  :hover {
    color: ${p => p.theme.subText};
  }
`;

const StyledIconUser = styled(IconUser)`
  margin-right: 20px;
`;

export default withTheme(WidgetCardChart);
