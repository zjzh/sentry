import React from 'react';
import {components, OptionProps} from 'react-select';
import styled from '@emotion/styled';

import Button from 'app/components/button';
import SearchBar from 'app/components/events/searchBar';
import SelectControl from 'app/components/forms/selectControl';
import Highlight from 'app/components/highlight';
import {IconAdd} from 'app/icons/iconAdd';
import {IconDelete} from 'app/icons/iconDelete';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {Organization} from 'app/types';

import AggregationOptions from './aggregationField';
import {AggregationOption, groupByMockOptions, metricMockOptions} from './utils';

type SelectControlOption = {
  label: string;
  value: string;
};

type Data = {
  metrics: Array<string>;
  queryTag: Array<string>;
  groupBy: string;
  aggregation: AggregationOption;
};

type Props = {
  organization: Organization;
  data: Array<Data>;
  onAdd: () => void;
  onDelete: (index: number) => () => void;
  onChange: <T extends keyof Data>(index: number, field: T, value: Data[T]) => void;
};

function GraphData({organization, data, onAdd, onDelete, onChange}: Props) {
  return (
    <Wrapper>
      {data.map(({metrics, groupBy, aggregation}, index) => (
        <Fields key={index}>
          <SelectControl
            help={t(
              'Choose the metric to graph by searching or selecting it from the dropdown.'
            )}
            name="metrics"
            placeholder={t('Select a metric')}
            options={metricMockOptions.map(metricMockOption => ({
              label: metricMockOption,
              value: metricMockOption,
            }))}
            value={metrics}
            onChange={(options: Array<SelectControlOption>) => {
              onChange(
                index,
                'metrics',
                options.map(option => option.value)
              );
            }}
            components={{
              Option: (option: OptionProps<SelectControlOption>) => {
                const {label, selectProps} = option;
                const {inputValue = ''} = selectProps;
                return (
                  <components.Option {...option}>
                    <Highlight text={inputValue}>{label}</Highlight>
                  </components.Option>
                );
              },
            }}
            multiple
          />
          <SearchBar organization={organization} />
          <SelectControl
            inFieldLabel={`${t('Group By')}: `}
            name="group-by"
            options={groupByMockOptions}
            value={groupBy}
            onChange={(option: SelectControlOption) => {
              onChange(index, 'groupBy', option.value);
            }}
          />
          <AggregationOptions
            value={aggregation}
            onChange={value => onChange(index, 'aggregation', value)}
          />
          <IconDeleteWrapper onClick={onDelete(index)}>
            <IconDelete aria-label={t('Delete Graph Condition')} />
          </IconDeleteWrapper>
        </Fields>
      ))}
      <div>
        <Button icon={<IconAdd isCircled />} size="small" onClick={onAdd}>
          {t('Add Query Data')}
        </Button>
      </div>
    </Wrapper>
  );
}

export default GraphData;

const Wrapper = styled('div')`
  display: grid;
  grid-gap: ${space(1.5)};
`;

const Fields = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr minmax(250px, auto) minmax(250px, auto) max-content;
  align-items: center;
  grid-gap: ${space(1.5)};
`;

const IconDeleteWrapper = styled('div')`
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;
