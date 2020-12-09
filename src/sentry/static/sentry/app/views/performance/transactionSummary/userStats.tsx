import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {SectionHeading} from 'app/components/charts/styles';
import Link from 'app/components/links/link';
import QuestionTooltip from 'app/components/questionTooltip';
import UserMisery from 'app/components/userMisery';
import {IconOpen} from 'app/icons';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import {getFieldRenderer} from 'app/utils/discover/fieldRenderers';
import {decodeScalar} from 'app/utils/queryString';
import {getTermHelp} from 'app/views/performance/data';
import {vitalsRouteWithQuery} from 'app/views/performance/transactionVitals/utils';

import VitalsCards from '../vitalsCards';

type Props = {
  eventView: EventView;
  totals: Record<string, number>;
  location: Location;
  organization: Organization;
  transactionName: string;
};

function UserStats({eventView, totals, location, organization, transactionName}: Props) {
  let userMisery = <StatNumber>{'\u2014'}</StatNumber>;
  const threshold = organization.apdexThreshold;
  let apdex: React.ReactNode = <StatNumber>{'\u2014'}</StatNumber>;

  if (totals) {
    const miserableUsers = Number(totals[`user_misery_${threshold}`]);
    const totalUsers = Number(totals.count_unique_user);
    if (!isNaN(miserableUsers) && !isNaN(totalUsers)) {
      userMisery = (
        <UserMisery
          bars={40}
          barHeight={30}
          miseryLimit={threshold}
          totalUsers={totalUsers}
          miserableUsers={miserableUsers}
        />
      );
    }

    const apdexKey = `apdex_${threshold}`;
    const formatter = getFieldRenderer(apdexKey, {[apdexKey]: 'number'});
    apdex = formatter(totals, {organization, location});
  }

  const webVitalsTarget = vitalsRouteWithQuery({
    orgSlug: organization.slug,
    transaction: transactionName,
    projectID: decodeScalar(location.query.project),
    query: location.query,
  });

  return (
    <Container>
      <div>
        <SectionHeading>
          {t('Apdex Score')}
          <QuestionTooltip
            position="top"
            title={t(
              'Apdex is the ratio of both satisfactory and tolerable response time to all response times.'
            )}
            size="sm"
          />
        </SectionHeading>
        <StatNumber>{apdex}</StatNumber>
        <Link to={`/settings/${organization.slug}/performance/`}>
          <SectionValue>
            {threshold}ms {t('threshold')}
          </SectionValue>
        </Link>
      </div>
      <VitalsContainer>
        <VitalsHeading>
          <SectionHeading>
            {t('Web Vitals')}
            <QuestionTooltip
              position="top"
              title={t(
                'Web Vitals with p75 better than the "poor" threshold, as defined by Google Web Vitals.'
              )}
              size="sm"
            />
          </SectionHeading>
          <Link to={webVitalsTarget}>
            <IconOpen />
          </Link>
        </VitalsHeading>
        <VitalsCards
          eventView={eventView}
          organization={organization}
          location={location}
          hasCondensedVitals
        />
      </VitalsContainer>
      <UserMiseryContainer>
        <SectionHeading>
          {t('User Misery')}
          <QuestionTooltip
            position="top"
            title={getTermHelp(organization, 'userMisery')}
            size="sm"
          />
        </SectionHeading>
        {userMisery}
      </UserMiseryContainer>
    </Container>
  );
}

const Container = styled('div')`
  display: grid;
  grid-row-gap: ${space(2)};
  margin-bottom: ${space(4)};
`;

const VitalsContainer = styled('div')``;

const VitalsHeading = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserMiseryContainer = styled('div')``;

const StatNumber = styled('div')`
  font-size: 32px;
  margin-bottom: ${space(0.5)};
  color: ${p => p.theme.textColor};

  > div {
    text-align: left;
  }
`;

const SectionValue = styled('span')`
  font-size: ${p => p.theme.fontSizeMedium};
`;

export default UserStats;
