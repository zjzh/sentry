import styled from '@emotion/styled';

import MenuControl from 'sentry/components/dropdownMenuControlV2';

export default {
  title: 'Components/Buttons/Dropdowns/Dropdown Control V2',
};

const Circle = styled('div')`
  width: 0.75em;
  height: 0.75em;
  border-radius: 50%;
  background: ${p => p.theme[p.color]};
`;

const CircleEl = ({color}) => <Circle color={color} />;

const onAction = console.log;

const items = [
  {
    key: 'armadillo',
    onAction,
    children: [
      {
        key: 'Archea',
        label: 'Archea',
        leadingItems: <CircleEl color="blue300" />,
        onAction,
      },
      {
        key: 'Eukaryota',
        label: 'Eukaryota',
        leadingItems: <CircleEl color="red300" />,
        onAction,
      },
    ],
  },
  {
    key: 'Bacteria',
    label: 'Bacteria',
    leadingItems: <CircleEl color="green300" />,
    isSubmenu: true,
    children: [
      {
        key: 'Proteobacteria',
        label: 'Proteobacteria',
        onAction,
      },
      {
        key: 'Aquifex',
        label: 'Aquifex',
        onAction,
        children: [
          {
            key: 'Planctomyces',
            label: 'Planctomyces',
            onAction,
          },
          {
            key: 'Thermotoga',
            label: 'Thermotoga',
            onAction,
          },
        ],
      },
    ],
  },
];

export const BasicLabelKnobs = ({}) => {
  return (
    <div>
      <MenuControl
        triggerLabel="Phylogenetics"
        items={items}
        onClose={() => console.log('closing')}
      />
    </div>
  );
};

BasicLabelKnobs.storyName = 'Basic';
BasicLabelKnobs.parameters = {
  docs: {
    description: {
      story: 'Using a string value for the button label',
    },
  },
};
