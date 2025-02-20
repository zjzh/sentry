import * as React from 'react';

import {ModalRenderProps} from 'sentry/actionCreators/modal';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import {t} from 'sentry/locale';

type Props = {
  onSave: () => void;
  title: string;
  content: React.ReactElement;
  disabled: boolean;
  btnSaveLabel?: string;
} & ModalRenderProps;

const Modal = ({
  title,
  onSave,
  content,
  disabled,
  Header,
  Body,
  Footer,
  closeModal,
  btnSaveLabel = t('Save'),
}: Props) => (
  <React.Fragment>
    <Header closeButton>{title}</Header>
    <Body>{content}</Body>
    <Footer>
      <ButtonBar gap={1.5}>
        <Button onClick={closeModal}>{t('Cancel')}</Button>
        <Button
          onClick={event => {
            event.preventDefault();
            onSave();
          }}
          disabled={disabled}
          type="submit"
          priority="primary"
          form="relay-form"
        >
          {btnSaveLabel}
        </Button>
      </ButtonBar>
    </Footer>
  </React.Fragment>
);

export default Modal;
