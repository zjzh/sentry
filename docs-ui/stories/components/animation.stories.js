import {Fragment} from 'react';
import styled from '@emotion/styled';

import MenuControl from 'sentry/components/dropdownMenuControlV2';
import {IconOpen} from 'sentry/icons';

import {openModal} from 'sentry/actionCreators/modal';
import Button from 'sentry/components/button';
import GlobalModal from 'sentry/components/globalModal';

export default {
  title: 'Core/Animation',
};

const Circle = styled('div')`
  width: 0.75em;
  height: 0.75em;
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

const items = [
  {
    id: 1,
    label: 'Aardvark – Blue',
    details: "Here're some more details",
    leadingItems: <CircleEl color="blue300" />,
    trailingItems: <Link />,
    showDividers: true,
  },
  {
    id: 2,
    label: 'Kangaroo – Green',
    details: "Here're some more details",
    leadingItems: <CircleEl color="green300" />,
    trailingItems: <Link />,
    showDividers: true,
  },
  {
    id: 3,
    label: 'Snake – Red',
    details: "Here're some more details",
    leadingItems: <CircleEl color="red300" />,
    trailingItems: <Link />,
    showDividers: true,
  },
];

export const BasicLabelKnobs = ({}) => {
  return (
    <div>
      <div>
        <h3>Quartic</h3>
        <Group>
          <MenuControl aria-label="Actions" onAction={() => {}} items={items} />
        </Group>
      </div>
      <hr />
      <div>
        <h3>Cubic</h3>
        <Group>
          <MenuControl
            aria-label="Actions"
            onAction={() => {}}
            easing="cubic"
            items={items}
          />
        </Group>
      </div>
      <hr />
      <div>
        <h3>Quadratic</h3>
        <Group>
          <MenuControl
            aria-label="Actions"
            onAction={() => {}}
            easing="quad"
            items={items}
          />
        </Group>
      </div>
      <hr />
      <div>
        <h3>Linear</h3>
        <Group>
          <MenuControl
            aria-label="Actions"
            onAction={() => {}}
            easing="linear"
            items={items}
          />
        </Group>
      </div>
    </div>
  );
};

const Group = styled.div`
  display: flex;
  gap: 1em;
`;

BasicLabelKnobs.storyName = 'Basic';
BasicLabelKnobs.parameters = {
  docs: {
    description: {
      story: 'Using a string value for the button label',
    },
  },
};
