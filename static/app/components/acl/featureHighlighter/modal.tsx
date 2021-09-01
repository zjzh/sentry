import {Fragment, useEffect, useState} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {addErrorMessage} from 'app/actionCreators/indicator';
import {ModalRenderProps} from 'app/actionCreators/modal';
import {Client} from 'app/api';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import Checkbox from 'app/components/checkbox';
import SelectControl from 'app/components/forms/selectControl';
import LoadingIndicator from 'app/components/loadingIndicator';
import TextOverflow from 'app/components/textOverflow';
import {t} from 'app/locale';
import space from 'app/styles/space';
import Input from 'app/views/settings/components/forms/controls/input';

import {ActionTypes, useFeatureHighlighter} from './context';

type Props = {} & ModalRenderProps;

const api = new Client();

export default function FeatureHighlighterModal({Body, Footer, closeModal}: Props) {
  const highlighter = useFeatureHighlighter();
  const [filterText, setFilterText] = useState('');
  const [organizationText, setOrganizationText] = useState('');
  const [isOrganizationLoading, setOrganizationLoading] = useState(false);

  useEffect(() => {
    highlighter?.loadFeatures();
  }, []);

  function handleFeatureToggle(feature: string) {
    return (e: React.FormEvent<HTMLInputElement>) => {
      e.preventDefault();
      highlighter?.setFeatureOverride({
        type: ActionTypes.TOGGLE_FEATURE,
        payload: {feature},
      });
    };
  }

  function handleApplyFeatures() {
    highlighter?.saveFeatures();
    closeModal();
  }

  function handleResetFeatures() {
    highlighter?.resetFeatures();
  }

  function handleSelectPlan({value}: {value: string; label: string}) {
    highlighter?.selectPlan(value);
  }

  function handleSelectAll() {
    highlighter?.selectAllFeatures();
  }

  function handleSelectNone() {
    highlighter?.selectNoFeatures();
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilterText(e.target.value ?? '');
  }

  async function handleSearchOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOrganizationLoading(true);

    try {
      const {features} = await api.requestPromise(`/featureflags/${organizationText}/`);
      highlighter?.selectFeatures(features);
    } catch (resp) {
      addErrorMessage(t('Unable to find organization'));
    } finally {
      setOrganizationText('');
      setOrganizationLoading(false);
    }
  }

  function handleChangeOrganizationText(e: React.ChangeEvent<HTMLInputElement>) {
    setOrganizationText(e.target.value ?? '');
  }

  return (
    <Fragment>
      <Body>
        {!highlighter?.allFeatures && <LoadingIndicator />}

        {!!highlighter?.allFeatures && (
          <div>
            <Section>
              <h3>Quick Select</h3>
              <OrganizationSearch onSubmit={handleSearchOrganization}>
                <OrganizationInput
                  placeholder={t('Select by Organization')}
                  name="organization"
                  value={organizationText}
                  onChange={handleChangeOrganizationText}
                />
                {isOrganizationLoading && <LoadingIndicator mini />}
              </OrganizationSearch>

              <SelectControl
                placeholder={t('... or select by Subscription')}
                onChange={handleSelectPlan}
                value={highlighter?.selectedPlan}
                choices={highlighter?.allFeatures.plans.map(({id, name}) => [
                  id,
                  `${name} (${id})`,
                ])}
              />
            </Section>

            <LightBreak />

            <Section>
              <Heading>
                <FilterInput
                  placeholder={t('Filter flags')}
                  value={filterText}
                  onChange={handleFilterChange}
                />

                <ButtonBar merged>
                  <Button
                    type="button"
                    size="small"
                    priority="default"
                    onClick={handleSelectNone}
                  >
                    {t('Select None')}
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    priority="primary"
                    onClick={handleSelectAll}
                  >
                    {t('Select All')}
                  </Button>
                </ButtonBar>
              </Heading>
              <FeaturesGrid>
                {highlighter.allFeatures.features
                  .filter(feature => !filterText || feature.includes(filterText))
                  .map(feature => {
                    const checked = highlighter?.stagedFeatures.indexOf(feature) > -1;
                    return (
                      <FeatureGridItem key={`${feature}-${checked}`} htmlFor={feature}>
                        <Checkbox
                          id={feature}
                          onChange={handleFeatureToggle(feature)}
                          checked={checked}
                        />
                        <TextOverflow>{feature}</TextOverflow>
                      </FeatureGridItem>
                    );
                  })}
              </FeaturesGrid>
            </Section>
          </div>
        )}
      </Body>
      <Footer>
        <ButtonBar gap={1}>
          <Button type="button" priority="default" onClick={handleResetFeatures}>
            {t('Reset')}
          </Button>
          <Button type="button" priority="primary" onClick={handleApplyFeatures}>
            {t('Apply Features')}
          </Button>
        </ButtonBar>
      </Footer>
    </Fragment>
  );
}

export const modalCss = css`
  width: 80%;
`;

const FeaturesGrid = styled('div')`
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: ${space(1)};
`;
const FeatureGridItem = styled('label')`
  display: flex;
  gap: ${space(0.25)};
  font-weight: normal;
  align-items: center;
`;
const Section = styled('section')`
  margin-bottom: ${space(2)};
`;
const LightBreak = styled('hr')`
  border-color: ${p => p.theme.innerBorder};
`;

const Heading = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${space(2)};
`;

const OrganizationInput = styled(Input)`
  margin-bottom: ${space(1)};
`;

const OrganizationSearch = styled('form')`
  display: flex;
  align-items: center;
`;

const Controls = styled('div')`
  display: flex;
`;

const FilterInput = styled(Input)`
  width: 400px;
  max-width: 30%;
`;
