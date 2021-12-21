import styled from '@emotion/styled';

import {IconOpen} from 'sentry/icons';
import Form from 'sentry/views/settings/components/forms/form';
import SelectField from 'sentry/views/settings/components/forms/selectField';

const Circle = styled('div')`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: ${p => p.theme[p.color]};
`;

const CircleEl = ({color}) => <Circle color={color} />;

const Link = () => (
  <StyledLink href="/">
    <IconOpen size="xs" />
  </StyledLink>
);

const StyledLink = styled('a')`
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.theme.subText};
  &:hover {
    color: ${p => p.theme.textColor};
  }
`;

export default {
  title: 'Components/Forms/Form',
  args: {
    showDividers: false,
    alignRight: false,
    required: false,
    visible: true,
    disabled: false,
    flexibleControlStateSize: true,
    inline: true,
    stacked: true,
  },
};

export const Default = ({...fieldProps}) => {
  return (
    <Form>
      <SelectField
        name="select"
        label="Select Field"
        options={[
          {
            label: 'Group 1',
            options: [
              {
                label: 'Choice One',
                value: '1',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="blue300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Two',
                value: '2',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="red300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Three',
                value: '3',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="green300" />,
                trailingItems: <Link />,
              },
            ],
          },
          {
            label: 'Group 2',
            options: [
              {
                label: 'Choice One',
                value: '12',
                leadingItems: <CircleEl color="blue300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Two',
                value: '22',
                leadingItems: <CircleEl color="red300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Three',
                value: '32',
                leadingItems: <CircleEl color="green300" />,
                trailingItems: <Link />,
              },
            ],
          },
        ]}
        {...fieldProps}
      />
      <SelectField
        name="select2"
        label="Select Field - Multiple"
        multiple
        options={[
          {
            label: 'Group 1',
            options: [
              {
                label: 'Choice One',
                value: '1',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="blue300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Two',
                value: '2',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="red300" />,
                trailingItems: <Link />,
              },
              {
                label: 'Choice Three',
                value: '3',
                details: "Here's some additional details",
                leadingItems: <CircleEl color="green300" />,
                trailingItems: <Link />,
              },
            ],
          },
          {
            label: 'Group 2',
            options: [
              {label: 'Choice One', value: '12'},
              {label: 'Choice Two', value: '22'},
              {label: 'Choice Three', value: '32'},
            ],
          },
        ]}
        {...fieldProps}
      />
    </Form>
  );
};

Default.storyName = 'Form';
Default.parameters = {
  docs: {
    description: {
      story:
        'Use the knobs to see how the different field props that can be used affect the form layout.',
    },
  },
};
