import React from 'react';
import styled from '@emotion/styled';

import space from 'app/styles/space';

import Toogler from './toggler';

const defaultProps = {
  toggled: false,
  isLast: true,
  isChildElement: false,
  isParentToggled: true,
};

type Props = {
  data: Array<any> | Record<string, any>;
  name?: string;
} & typeof defaultProps;

type State = {
  isToggled: boolean;
};

class Tree extends React.Component<Props, State> {
  static defaultProps = defaultProps;

  state: State = {isToggled: this.props.toggled};

  handleToggle = () => {
    this.setState(state => ({isToggled: !state.isToggled}));
  };

  renderInnerContent = (key: string, index: number, children: Array<string>) => {
    const {data, isParentToggled, toggled} = this.props;
    const {isToggled} = this.state;

    const dataValue = data[key];

    if (typeof dataValue === 'object') {
      return (
        <Tree
          key={index}
          data={dataValue}
          isLast={index === children.length - 1}
          name={Array.isArray(data) ? undefined : key}
          isParentToggled={isParentToggled && isToggled}
          toggled={toggled}
          isChildElement
        />
      );
    }

    if (!isToggled) {
      return null;
    }

    return (
      <Item isPrimitive>
        {Array.isArray(data) ? '' : <strong>{key}: </strong>}
        {dataValue}
        {index === children.length - 1 ? '' : ','}
      </Item>
    );
  };

  render() {
    const {data, isLast, name, isChildElement, isParentToggled} = this.props;

    if (!isParentToggled) {
      return null;
    }

    const {isToggled} = this.state;

    const isDataArray = Array.isArray(data);

    return (
      <Wrapper isChildElement={!!isChildElement}>
        <Item>
          <Toogler onToggle={this.handleToggle} isToggled={isToggled} />
          <Content>
            {name && `${name}:`}
            {isDataArray ? '[' : '{'}
            {!isToggled && '\u2026'}
            {Object.keys(data).map(this.renderInnerContent)}
            {isDataArray ? ']' : '}'}
            {!isLast ? ',' : ''}
          </Content>
        </Item>
      </Wrapper>
    );
  }
}

export default Tree;

const Wrapper = styled('div')<{isChildElement: boolean}>`
  margin-left: ${p => (p.isChildElement ? space(2) : 0)};
  font-family: ${p => p.theme.text.familyMono};
  font-size: ${p => p.theme.fontSizeSmall};
  position: relative;
  :before {
    content: '';
    position: absolute;
    top: 24px;
    left: 1px;
    height: calc(100% - 48px);
    border-left: 1px solid ${p => p.theme.gray200};
  }
`;

const Item = styled('div')<{isPrimitive?: boolean}>`
  margin-left: ${p => (p.isPrimitive ? space(2) : 0)};
  display: flex;
  outline: none;
`;

const Content = styled('div')``;
