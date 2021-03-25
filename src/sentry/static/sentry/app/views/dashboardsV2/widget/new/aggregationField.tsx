import React from 'react';

import SelectControl from 'app/components/forms/selectControl';
import {t} from 'app/locale';

import {AggregationOption} from './utils';

const aggregationOptions = {
  [AggregationOption.AVG_BY]: t('Avg By'),
  [AggregationOption.MAX_BY]: t('Max By'),
  [AggregationOption.MIN_BY]: t('Min By'),
  [AggregationOption.SUM_BY]: t('Sum By'),
};

type Props = {
  value: AggregationOption;
  onChange: (value: AggregationOption) => void;
};

function AggregationField({value, onChange}: Props) {
  return (
    <SelectControl
      inFieldLabel={`${t('Aggregation')}: `}
      name="aggregation"
      options={Object.entries(aggregationOptions).map(([key, label]) => ({
        label,
        value: key,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}

export default AggregationField;
