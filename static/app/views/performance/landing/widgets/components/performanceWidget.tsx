import {useState} from 'react';

import {
  AreaWidgetProps,
  GenericPerformanceWidgetDataType,
  WidgetData,
  WidgetDataTypes,
} from '../types';

import {QueryHandler} from './queryHandler';

type WidgetPropUnion = AreaWidgetProps;

export function GenericPerformanceWidget(props: WidgetPropUnion) {
  const [widgetData, setWidgetData] = useState<WidgetData>({});

  const setWidgetDataForKey = (dataKey: string, result: WidgetDataTypes) => {
    const newData: WidgetData = {...widgetData, [dataKey]: result};
    setWidgetData(newData);
  };
  const widgetProps = {widgetData, setWidgetDataForKey};

  switch (props.dataType) {
    case GenericPerformanceWidgetDataType.area:
      return (
        <QueryHandler
          widgetData={widgetData}
          setWidgetDataForKey={setWidgetDataForKey}
          queryProps={props}
          queries={Object.entries(props.Queries).map(([key, definition]) => ({
            ...definition,
            queryKey: key,
          }))}
        >
          <AreaWidget {...props} {...widgetProps} />
        </QueryHandler>
      );
    default:
      throw new Error(`Missing support for data type: '${props.dataType}'`);
  }
}
