import styled from '@emotion/styled';

import MenuControl from 'sentry/components/dropdownMenuControlV2';
import {IconOpen} from 'sentry/icons';

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
  return <MenuControl onAction={console.log} aria-label="Actions" items={items} />;
};

BasicLabelKnobs.storyName = 'Basic';
BasicLabelKnobs.parameters = {
  docs: {
    description: {
      story: 'Using a string value for the button label',
    },
  },
};
