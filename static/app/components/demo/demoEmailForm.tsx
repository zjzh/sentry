import React from 'react';
import styled from '@emotion/styled';

import {ModalRenderProps} from 'app/actionCreators/modal';
import {t, tct} from 'app/locale';
import Form from 'app/views/settings/components/forms/form';
import JsonForm from 'app/views/settings/components/forms/jsonForm';
import {JsonFormObject} from 'app/views/settings/components/forms/type';

type props = ModalRenderProps;

const fields: JsonFormObject[] = [
  {
    title: t('Email Form'),
    fields: [
      {
        name: 'email',
        type: 'email',
        required: true,
        label: t('Email'),
      },
    ],
  },
];

export default class DemoEmailForm extends React.Component<props> {
  render() {
    const {Body} = this.props;
    return (
      <React.Fragment>
        <Body>
          <Form apiMethod="POST" apiEndpoint="/demo/email-capture/">
            <JsonForm forms={fields} />
          </Form>
        </Body>
      </React.Fragment>
    );
  }
}
