import * as React from 'react';

import OptionSelector from 'app/components/charts/optionSelector';
import {
  ChartControls,
  InlineContainer,
  SectionHeading,
  SectionValue,
} from 'app/components/charts/styles';
import {t} from 'app/locale';
import {SelectValue} from 'app/types';
import {DisplayModes} from 'app/utils/discover/types';

type Props = {
  total: number | null;
  yAxisValue: string;
  yAxisOptions: SelectValue<string>[];
  onAxisChange: (value: string) => void;
  displayMode: string;
  displayOptions: SelectValue<string>[];
  onDisplayChange: (value: string) => void;
  sensitivity: string;
  sensitivityOptions: SelectValue<string>[];
  onSensitivityChange: (value: string) => void;
  smoothing: string;
  smoothingOptions: SelectValue<string>[];
  onSmoothingChange: (value: string) => void;
};

export default function ChartFooter({
  total,
  yAxisValue,
  yAxisOptions,
  onAxisChange,
  displayMode,
  displayOptions,
  onDisplayChange,
  sensitivity,
  sensitivityOptions,
  onSensitivityChange,
  smoothing,
  smoothingOptions,
  onSmoothingChange,
}: Props) {
  const elements: React.ReactNode[] = [];

  elements.push(<SectionHeading key="total-label">{t('Total Events')}</SectionHeading>);
  elements.push(
    total === null ? (
      <SectionValue data-test-id="loading-placeholder" key="total-value">
        &mdash;
      </SectionValue>
    ) : (
      <SectionValue key="total-value">{total.toLocaleString()}</SectionValue>
    )
  );

  return (
    <ChartControls>
      <InlineContainer>{elements}</InlineContainer>
      <InlineContainer>
        <OptionSelector
          title={t('Display')}
          selected={displayMode}
          options={displayOptions}
          onChange={onDisplayChange}
          menuWidth="170px"
        />
        {displayMode === DisplayModes.ANOMALY && (
          <React.Fragment>
            <OptionSelector
              title={t('Sensitivity')}
              selected={sensitivity}
              options={sensitivityOptions}
              onChange={onSensitivityChange}
              menuWidth="170px"
            />
            <OptionSelector
              title={t('Smoothing')}
              selected={smoothing}
              options={smoothingOptions}
              onChange={onSmoothingChange}
              menuWidth="170px"
            />
          </React.Fragment>
        )}
        <OptionSelector
          title={t('Y-Axis')}
          selected={yAxisValue}
          options={yAxisOptions}
          onChange={onAxisChange}
        />
      </InlineContainer>
    </ChartControls>
  );
}
