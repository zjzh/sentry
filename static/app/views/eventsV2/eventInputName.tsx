import {browserHistory} from 'react-router';
import styled from '@emotion/styled';

import EditableText from 'sentry/components/editableText';
import {Title} from 'sentry/components/layouts/thirds';
import {t} from 'sentry/locale';
import {Organization, SavedQuery} from 'sentry/types';
import EventView from 'sentry/utils/discover/eventView';
import useApi from 'sentry/utils/useApi';

import {handleUpdateQueryName} from './savedQuery/utils';

type Props = {
  organization: Organization;
  eventView: EventView;
  savedQuery?: SavedQuery;
};

const NAME_DEFAULT = t('Untitled query');

/**
 * Allows user to edit the name of the query.
 * By pressing Enter or clicking outside the component, the changes will be saved, if valid.
 */
function EventInputName({organization, eventView, savedQuery}: Props) {
  const api = useApi();

  function handleChange(nextQueryName: string) {
    // Do not update automatically if
    // 1) It is a new query
    // 2) The new name is same as the old name
    if (!savedQuery || savedQuery.name === nextQueryName) {
      return;
    }

    // This ensures that we are updating SavedQuery.name only.
    // Changes on QueryBuilder table will not be saved.
    const nextEventView = EventView.fromSavedQuery({
      ...savedQuery,
      name: nextQueryName,
    });

    handleUpdateQueryName(api, organization, nextEventView).then(
      (_updatedQuery: SavedQuery) => {
        // The current eventview may have changes that are not explicitly saved.
        // So, we just preserve them and change its name
        const renamedEventView = eventView.clone();
        renamedEventView.name = nextQueryName;

        browserHistory.push(renamedEventView.getResultsViewUrlTarget(organization.slug));
      }
    );
  }

  const value = eventView.name || NAME_DEFAULT;

  return (
    <StyledTitle data-test-id={`discover2-query-name-${value}`}>
      <EditableText
        value={value}
        onChange={handleChange}
        isDisabled={!eventView.id}
        errorMessage={t('Please set a name for this query')}
      />
    </StyledTitle>
  );
}

const StyledTitle = styled(Title)`
  overflow: unset;
`;

export default EventInputName;
