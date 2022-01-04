import {ReactNode, useRef} from 'react';
import styled from '@emotion/styled';
import {useMenuItem} from '@react-aria/menu';

import space from 'sentry/styles/space';

export type Item = {
  key: string;
  rendered: ReactNode;
  props: {
    label?: string;
    details?: string;
    showDividers?: boolean;
    leadingItems?: ReactNode;
    trailingItems?: ReactNode;
    onAction?: () => void;
  };
};

type Props = {
  item: Item;
  nextItem: Item;
  state: any;
  onAction: () => void;
};

function MenuItem({item, nextItem, state, onAction}: Props) {
  const ref = useRef(null);
  const isDisabled = state.disabledKeys.has(item.key);
  const isFocused = state.selectionManager.focusedKey === item.key;
  const actionHandler = item.props.onAction ?? onAction;
  const nextItemIsFocused = state.selectionManager?.state?.focusedKey === nextItem?.key;

  const {menuItemProps} = useMenuItem(
    {
      key: item.key,
      onAction: actionHandler,
      isDisabled,
    },
    state,
    ref
  );

  const {details, showDividers, leadingItems, trailingItems} = item.props;
  const label = item.rendered ?? item.props.label;

  return (
    <Wrap ref={ref} {...menuItemProps}>
      <InnerWrap isFocused={isFocused}>
        {leadingItems && <LeadingItems>{leadingItems}</LeadingItems>}
        <ContentWrap
          isFocused={isFocused}
          nextItemIsFocused={nextItemIsFocused}
          showDividers={showDividers}
        >
          <div>
            <Label>{label}</Label>
            {details && <Details>{details}</Details>}
          </div>
          {trailingItems && <TrailingItems>{trailingItems}</TrailingItems>}
        </ContentWrap>
      </InnerWrap>
    </Wrap>
  );
}

export default MenuItem;

const Wrap = styled('li')`
  font-size: ${p => p.theme.fontSizeMedium};
  list-style-type: none;
  margin: 0;
  padding: 0 ${space(0.5)};
  cursor: pointer;

  :focus-visible {
    outline: none;
  }
`;

const InnerWrap = styled('div')<{isFocused: boolean}>`
  display: flex;
  padding: 0 ${space(1)};
  border-radius: ${p => p.theme.borderRadius};
  box-sizing: border-box;
  background: ${p => p.theme.backgroundElevated};

  ${p => p.isFocused && `background: ${p.theme.hover};`}
`;

const LeadingItems = styled('div')`
  display: flex;
  align-items: center;
  height: 1.4em;
  gap: ${space(1)};
  padding: ${space(1)} 0;
  margin-right: ${space(1)};
  margin-top: ${space(1)};
`;

const ContentWrap = styled('div')<{
  isFocused: boolean;
  nextItemIsFocused: boolean;
  showDividers?: boolean;
}>`
  position: relative;
  width: 100%;
  display: flex;
  gap: ${space(2)};
  justify-content: space-between;
  padding: ${space(1)} 0;

  ${p =>
    p.showDividers &&
    !p.isFocused &&
    !p.nextItemIsFocused &&
    `
      box-shadow: 0 1px 0 0 ${p.theme.innerBorder};

      ${Wrap}:last-of-type & {
        box-shadow: none;
      }
    `}
`;

const Label = styled('p')`
  margin-bottom: 0;
  line-height: 1.4;
`;

const Details = styled('p')`
  font-size: 14px;
  line-height: 1.2;
  color: ${p => p.theme.subText};
  margin-bottom: 0;
`;

const TrailingItems = styled('div')`
  display: flex;
  align-items: center;
  height: 1.4em;
  gap: ${space(1)};
  margin-right: ${space(0.5)};
`;
