import SentryAppComponentsActions from 'app/actions/sentryAppComponentActions';
import {Client} from 'app/api';
import {SentryAppComponent} from 'app/types';

export async function fetchSentryAppComponents(
  api: Client,
  orgSlug: string,
  projectId: string,
  filter: string[] = ['issue-link']
): Promise<SentryAppComponent[]> {
  const filterParam = filter.length && `&filter=${filter.join(',')}`;
  const componentsUri = `/organizations/${orgSlug}/sentry-app-components/?projectId=${projectId}${filterParam}`;

  const res = await api.requestPromise(componentsUri);
  SentryAppComponentsActions.loadComponents(res);
  return res;
}
