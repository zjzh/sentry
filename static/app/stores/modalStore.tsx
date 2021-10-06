import Reflux from 'reflux';

import {ModalOptions, ModalRenderProps} from 'app/actionCreators/modal';
import ModalActions from 'app/actions/modalActions';

import {CommonStoreInterface} from './types';

type Renderer = (renderProps: ModalRenderProps) => React.ReactNode;

type State = {
  renderer: Renderer | null;
  options: ModalOptions;
};

type ModalStoreInterface = CommonStoreInterface<State> & {
  init(): void;
  reset(): void;
  onCloseModal(): void;
  onOpenModal(renderer: Renderer, options: ModalOptions): void;
};

const storeConfig: Reflux.StoreDefinition & ModalStoreInterface = {
  init() {
    this.reset();
    this.listenTo(ModalActions.closeModal, this.onCloseModal);
    this.listenTo(ModalActions.openModal, this.onOpenModal);
  },

  reset() {
    this.state = {
      renderer: null,
      options: {},
    } as State;
  },

  onCloseModal() {
    this.reset();
    this.trigger(this.state);
  },

  onOpenModal(renderer: Renderer, options: ModalOptions) {
    this.state = {renderer, options};
    this.trigger(this.state);
  },

  getState() {
    return this.state;
  },
};

const ModalStore = Reflux.createStore(storeConfig) as Reflux.Store & ModalStoreInterface;

export default ModalStore;
