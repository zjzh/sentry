import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {Client} from 'app/api';
import SelectControl from 'app/components/forms/selectControl';
import space from 'app/styles/space';
import {GlobalSelection, Organization} from 'app/types';

import {DISPLAY_TYPE_CHOICES} from '../../data';
import WidgetCard from '../../widgetCard';

import {visualizationColors} from './utils';

type SelectControlOption = {
  label: string;
  value: string;
};

type Visualization = {
  type: string;
  color: string;
};

type Props = {
  api: Client;
  organization: Organization;
  location: Location;
  selection: GlobalSelection;
  visualization: Visualization;
  onChange: (key: 'visualization', visualization: Visualization) => void;
};

function GraphVisualization({
  api,
  organization,
  location,
  selection,
  visualization,
  onChange,
}: Props) {
  return (
    <Wrapper>
      <Fields>
        <SelectControl
          name="visualizationDisplay"
          options={DISPLAY_TYPE_CHOICES.slice()}
          value={visualization.type}
          onChange={(option: SelectControlOption) => {
            onChange('visualization', {
              ...visualization,
              type: option.value,
            });
          }}
        />
        <SelectControl
          name="visualizationColor"
          options={visualizationColors.slice()}
          value={visualization.color}
          onChange={(option: SelectControlOption) => {
            onChange('visualization', {
              ...visualization,
              color: option.value,
            });
          }}
        />
        {/* <SelectControl
          name="visualizationDisplay"
          options={visualizationColors.slice()}
          value={visualization.color}
          onChange={(option: SelectControlOption) => {
            onChange('visualization', {
              ...visualization,
              color: option.value,
            });
          }}
        /> */}
      </Fields>
      <WidgetCard
        api={api}
        organization={organization}
        location={location}
        widget={{
          title: '',
          displayType: 'line',
          interval: '5m',
          queries: [{name: '', fields: ['count()'], conditions: '', orderby: ''}],
          loading: false,
        }}
        selection={selection}
        onDelete={() => {}}
        onEdit={() => {}}
        isSorting={false}
        currentWidgetDragging={false}
        isEditing={false}
      />
    </Wrapper>
  );
}

export default GraphVisualization;

const Wrapper = styled('div')`
  display: grid;
  grid-gap: ${space(1.5)};
`;

const Fields = styled('div')`
  display: grid;
  grid-template-columns: 1fr minmax(200px, auto);
  grid-gap: ${space(1.5)};
`;
