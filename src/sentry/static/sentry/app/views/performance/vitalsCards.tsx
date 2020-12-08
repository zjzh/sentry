import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import Card from 'app/components/card';
import Link from 'app/components/links/link';
import QuestionTooltip from 'app/components/questionTooltip';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import {getAggregateAlias, WebVital} from 'app/utils/discover/fields';
import {decodeList} from 'app/utils/queryString';
import VitalsCardsDiscoverQuery from 'app/views/performance/vitalDetail/vitalsCardsDiscoverQuery';

import ColorBar from './vitalDetail/colorBar';
import {
  vitalAbbreviations,
  vitalDescription,
  vitalDetailRouteWithQuery,
  vitalMap,
  vitalsBaseFields,
  vitalsMehFields,
  vitalsP75Fields,
  vitalsPoorFields,
  VitalState,
  vitalStateColors,
} from './vitalDetail/utils';
import VitalPercents from './vitalDetail/vitalPercents';

type Props = {
  eventView: EventView;
  organization: Organization;
  location: Location;
  showVitalPercentNames?: boolean;
};

export default function VitalsCards(props: Props) {
  const {eventView, organization, location} = props;
  const vitalsView = eventView.clone();

  const shownVitals = [WebVital.FCP, WebVital.LCP, WebVital.FID, WebVital.CLS];

  return (
    <VitalsCardsDiscoverQuery
      eventView={vitalsView}
      orgSlug={organization.slug}
      location={location}
    >
      {({isLoading, tableData}) => (
        <VitalsContainer>
          {shownVitals.map(vitalName => (
            <LinkedVitalsCard
              key={vitalName}
              vitalName={vitalName}
              tableData={tableData}
              isLoading={isLoading}
              {...props}
            />
          ))}
        </VitalsContainer>
      )}
    </VitalsCardsDiscoverQuery>
  );
}

const VitalsContainer = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space(2)};
  margin-bottom: ${space(2)};
`;

type CardProps = Props & {
  vitalName: WebVital;
  tableData: any;
  isLoading?: boolean;
  noBorder?: boolean;
};

const NonPanel = styled('div')`
  flex-grow: 1;
`;

const StyledVitalCard = styled(Card)`
  color: ${p => p.theme.textColor};
  padding: ${space(1.5)} ${space(2)} ${space(2)} ${space(2)};

  &:focus,
  &:hover {
    color: ${p => p.theme.textColor};
    top: -1px;
  }
`;

export function LinkedVitalsCard(props: CardProps) {
  const {vitalName} = props;
  return (
    <VitalLink {...props} vitalName={vitalName}>
      <VitalsCard {...props} />
    </VitalLink>
  );
}

export function VitalsCard(props: CardProps) {
  const {isLoading, tableData, vitalName, noBorder} = props;

  const measurement = vitalMap[vitalName];

  const Container = noBorder ? NonPanel : StyledVitalCard;

  if (isLoading || !tableData || !tableData.data || !tableData.data[0]) {
    return <BlankCard noBorder={noBorder} measurement={measurement} />;
  }

  const result = tableData.data[0];
  const base = result[getAggregateAlias(vitalsBaseFields[vitalName])];

  if (!base) {
    return <BlankCard noBorder={noBorder} measurement={measurement} />;
  }

  const poorCount: number =
    parseFloat(result[getAggregateAlias(vitalsPoorFields[vitalName])]) || 0;
  const mehCount: number =
    parseFloat(result[getAggregateAlias(vitalsMehFields[vitalName])]) || 0;

  const baseCount: number = parseFloat(base) || Number.MIN_VALUE;

  const p75: number =
    parseFloat(result[getAggregateAlias(vitalsP75Fields[vitalName])]) || 0;

  const value = vitalName === WebVital.CLS ? p75.toFixed(2) : p75.toFixed(0);

  const poorPercent = poorCount / baseCount;
  const mehPercent = (mehCount - poorCount) / baseCount;
  const goodPercent = 1 - poorPercent - mehPercent;

  const percents = [
    {
      vitalState: VitalState.GOOD,
      percent: goodPercent,
    },
    {
      vitalState: VitalState.MEH,
      percent: mehPercent,
    },
    {
      vitalState: VitalState.POOR,
      percent: poorPercent,
    },
  ];

  const colorStops = percents.map(({percent, vitalState}) => ({
    percent,
    color: vitalStateColors[vitalState],
  }));

  return (
    <Container interactive>
      {props.noBorder || (
        <CardTitle>
          <StyledTitle>{t(`${measurement}`)}</StyledTitle>
          <QuestionTooltip
            size="sm"
            position="top"
            title={t(vitalName ? vitalDescription[vitalName] || '' : '')}
          />
        </CardTitle>
      )}
      {props.noBorder || (
        <CardValue>
          {value}
          {vitalName !== WebVital.CLS && t('ms')}
        </CardValue>
      )}
      <CardBreakdown>
        <ColorBar colorStops={colorStops} />
      </CardBreakdown>
      <CardPercents>
        <VitalPercents
          percents={percents}
          showVitalPercentNames={props.showVitalPercentNames}
        />
      </CardPercents>
    </Container>
  );
}

const CardBreakdown = styled('div')`
  margin-top: ${space(2)};
`;

const StyledTitle = styled('span')`
  margin-right: ${space(0.5)};
`;

const CardPercents = styled('div')`
  width: 100%;
  display: flex;
  justify-content: flex-start;
`;

type BlankCardProps = {
  noBorder?: boolean;
  measurement?: string;
};

const BlankCard = (props: BlankCardProps) => {
  const Container = props.noBorder ? NonPanel : StyledVitalCard;
  return (
    <Container interactive>
      {props.noBorder || <CardTitle>{t(`${props.measurement}`)}</CardTitle>}
      <CardValue>{'\u2014'}</CardValue>
    </Container>
  );
};

type VitalLinkProps = Props & {
  vitalName: WebVital;
  children: React.ReactNode;
};

const VitalLink = (props: VitalLinkProps) => {
  const {organization, eventView, vitalName, children, location} = props;

  const view = eventView.clone();

  const target = vitalDetailRouteWithQuery({
    orgSlug: organization.slug,
    query: view.generateQueryStringObject(),
    vitalName,
    projectID: decodeList(location.query.project),
  });

  return (
    <Link
      to={target}
      data-test-id={`vitals-linked-card-${vitalAbbreviations[vitalName]}`}
    >
      {children}
    </Link>
  );
};

const CardTitle = styled('div')`
  font-size: ${p => p.theme.fontSizeLarge};
  margin-bottom: ${space(0.5)};
`;
const CardValue = styled('div')`
  font-size: 32px;
  margin-top: ${space(1)};
`;
