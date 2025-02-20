import * as React from 'react';
import isPropValid from '@emotion/is-prop-valid';
import styled from '@emotion/styled';

import Radio from 'sentry/components/radio';
import space from 'sentry/styles/space';

const Container = styled('div')<{orientInline?: boolean}>`
  display: grid;
  gap: ${p => space(p.orientInline ? 3 : 1)};
  grid-auto-flow: ${p => (p.orientInline ? 'column' : 'row')};
  grid-auto-rows: max-content;
  grid-auto-columns: max-content;
`;

type RadioGroupProps<C extends string> = {
  label: string;
  disabled?: boolean;
  /**
   * An array of [id, name, description]
   */
  choices: [C, React.ReactNode, React.ReactNode?][];
  value: string | number | null;
  onChange: (id: C, e: React.FormEvent<HTMLInputElement>) => void;
  /**
   * Switch the radio items to flow left to right, instead of vertically.
   */
  orientInline?: boolean;
};

type Props<C extends string> = RadioGroupProps<C> &
  Omit<React.ComponentPropsWithoutRef<typeof Container>, keyof RadioGroupProps<C>>;

const RadioGroup = <C extends string>({
  value,
  disabled,
  choices,
  label,
  onChange,
  orientInline,
  ...props
}: Props<C>) => (
  <Container
    orientInline={orientInline}
    {...props}
    role="radiogroup"
    aria-labelledby={label}
  >
    {(choices || []).map(([id, name, description], index) => (
      <RadioLineItem
        key={index}
        role="radio"
        index={index}
        aria-checked={value === id}
        disabled={disabled}
      >
        <Radio
          aria-label={id}
          disabled={disabled}
          checked={value === id}
          onChange={(e: React.FormEvent<HTMLInputElement>) =>
            !disabled && onChange(id, e)
          }
        />
        <RadioLineText disabled={disabled}>{name}</RadioLineText>
        {description && (
          <React.Fragment>
            {/* If there is a description then we want to have a 2x2 grid so the first column width aligns with Radio Button */}
            <div />
            <Description>{description}</Description>
          </React.Fragment>
        )}
      </RadioLineItem>
    ))}
  </Container>
);

const shouldForwardProp = (p: PropertyKey) =>
  typeof p === 'string' && !['disabled', 'animate'].includes(p) && isPropValid(p);

export const RadioLineItem = styled('label', {shouldForwardProp})<{
  disabled?: boolean;
  index: number;
}>`
  display: grid;
  gap: 0.25em 0.5em;
  grid-template-columns: max-content auto;
  align-items: center;
  cursor: ${p => (p.disabled ? 'default' : 'pointer')};
  outline: none;
  font-weight: normal;
  margin: 0;
`;

const RadioLineText = styled('div', {shouldForwardProp})<{disabled?: boolean}>`
  opacity: ${p => (p.disabled ? 0.4 : null)};
`;

const Description = styled('div')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeRelativeSmall};
  line-height: 1.4em;
`;

export default RadioGroup;
