import {PlainRoute} from 'react-router';
import Reflux from 'reflux';

import SettingsBreadcrumbActions from 'sentry/actions/settingsBreadcrumbActions';
import getRouteStringFromRoutes from 'sentry/utils/getRouteStringFromRoutes';

type UpdateData = {
  routes: PlainRoute<any>[];
  title: string;
};

type SettingsBreadcrumbStoreInterface = {
  init(): void;
  reset(): void;
  onUpdateRouteMap(update: UpdateData): void;
  onTrimMappings(routes: PlainRoute<any>[]): void;
  getPathMap(): Internals['pathMap'];
};

type Internals = {
  pathMap: Record<string, string>;
};

const storeConfig: Reflux.StoreDefinition & Internals & SettingsBreadcrumbStoreInterface =
  {
    pathMap: {},
    init() {
      this.reset();
      this.listenTo(SettingsBreadcrumbActions.mapTitle, this.onUpdateRouteMap);
      this.listenTo(SettingsBreadcrumbActions.trimMappings, this.onTrimMappings);
    },

    reset() {
      this.pathMap = {};
    },

    getPathMap() {
      return this.pathMap;
    },

    onUpdateRouteMap({routes, title}) {
      this.pathMap[getRouteStringFromRoutes(routes)] = title;
      this.trigger(this.pathMap);
    },

    onTrimMappings(routes) {
      const routePath = getRouteStringFromRoutes(routes);
      for (const fullPath in this.pathMap) {
        if (!routePath.startsWith(fullPath)) {
          delete this.pathMap[fullPath];
        }
      }
      this.trigger(this.pathMap);
    },
  };

const SettingsBreadcrumbStore = Reflux.createStore(storeConfig) as Reflux.Store &
  SettingsBreadcrumbStoreInterface;

export default SettingsBreadcrumbStore;
