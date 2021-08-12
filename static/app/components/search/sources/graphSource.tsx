import * as React from 'react';
import styled from '@emotion/styled';
import {Date as SugarDate} from 'sugar';

import {GlobalSelection, Organization} from 'app/types';
import {Client} from 'app/api';
import WidgetCard from 'app/views/dashboardsV2/widgetCard';
import theme from 'app/utils/theme';
import withApi from 'app/utils/withApi';
import withOrganizations from 'app/utils/withOrganizations';
import withGlobalSelection from 'app/utils/withGlobalSelection';
// todo: remove unnecessary imports
import {
  DisplayType,
  // Widget,
  // WidgetQuery,
} from 'app/views/dashboardsV2/types';
import {IconGraphLine} from 'app/icons/iconGraphLine';


type Props = {
	api: Client;
	organization: Organization;
	selection: GlobalSelection;
  /**
   * search term
   */
  query: string;
  /**
   * fusejs options.
   */
  // searchOptions?: Fuse.FuseOptions<FormSearchField>;
};

const GraphSourceWrapper = styled('div')`
	padding: 10px;
`
const GraphSourceHeadingWrap = styled('div')`
	display: flex;
	align-items: center;
	margin-bottom: 5px;
	margin-left: 5px;
`
const GraphSourceHeading = styled('p')`
	font-size: 0.875em;
	font-weight: 700;
	color: ${p => p.theme.gray300};
	text-transform: uppercase;
	margin-left: 5px;
	margin-bottom: 0;
`

const quantities = [
	{
		query: 'errors', 
		name: 'Errors',
		conditions: 'event.type:error', 
		defaultFields: ["count()"]
	},
	{
		query: 'default', 
		name: 'Default',
		conditions: 'event.type:default', 
		defaultFields: ["count()"]
	}
]

class GraphSource extends React.Component<Props> {
	static defaultProps = {
		searchOptions: {}
	}

	parseDatetimeFromQuery(query: string) : GlobalSelection.datetime {
		const datetime = {};

		const isValidDate = (d: Date) : boolean => d instanceof Date && !isNaN(d)

		// Parses a query string to find the date mentioned at the beginning
		// of the string. Note that the date is assumed to be at the beginning.
		// E.g. if queryString = 'Jul 8 until Jul 12', then the return value is
		// a Date object representing Jul 8
		const parseDateFromQueryString = (queryString: string) : Date => {
			const succeedingWords = queryString.split(' ')
			let dateWordLength = 1
			let dateString = succeedingWords.slice(0, dateWordLength).join(' ')
			let dateObject = SugarDate.create(dateString)
			while (dateWordLength < succeedingWords.length && isValidDate(dateObject)) {
				dateWordLength += 1
				dateString = succeedingWords.slice(0, dateWordLength).join(' ')
				if (isValidDate(SugarDate.create(dateString))) {
					dateObject = SugarDate.create(dateString)
				}
			}
			return dateObject
		}

		const fromIndex = query.search('from')

		if (fromIndex > -1) {
			const succeedingString = query.slice(fromIndex + 5)
			const dateObject = parseDateFromQueryString(succeedingString)
			if (isValidDate(dateObject)) {
				datetime.start = dateObject
				datetime.end = (new Date(dateObject)).setDate(dateObject.getDate() + 14);
			}
		}

		const toIndex = query.search('to')

		if (toIndex > -1) {
			const succeedingString = query.slice(toIndex + 3)
			const dateObject = parseDateFromQueryString(succeedingString)
			if (isValidDate(dateObject)) {
				datetime.end = dateObject
			}
		}

		const untilIndex = query.search('until');

		if (untilIndex > -1) {
			const succeedingString = query.slice(untilIndex + 6)
			const dateObject = parseDateFromQueryString(succeedingString)
			if (isValidDate(dateObject)) {
				datetime.end = dateObject
			}
		}

		return datetime;
	}

	parseQuantityFromQuery(query: string) : Widget {
    const mentionedQuantities = quantities.filter(quantity => query.includes(quantity.query))
    if (mentionedQuantities.length > 0) {
			const widget = {
		  	title: '',
	      displayType: DisplayType.LINE,
	      interval: '5m',
	      queries: []
	    };
    	mentionedQuantities.forEach(quantityObject => {
    		widget.queries.push({
    			"name": quantityObject.name,
    			"fields": quantityObject.defaultFields,
    			"conditions": quantityObject.conditions,
    			"orderby": ""
    		});
    	});
    	return widget;
    }
    return null;
	}

	render() {
		const {
			api, 
			// todo: loop through all orgs?
			organizations, 
			query, 
			selection
		} = this.props;
		const queriedDatetime = this.parseDatetimeFromQuery(query)
		const widget = this.parseQuantityFromQuery(query);

		if (!widget) {
			return null;
		}

		const modifiedSelection = {
			...selection,
			datetime: {
				...selection.datetime,
				...queriedDatetime
			}
		}

		return (
			<GraphSourceWrapper>
				<GraphSourceHeadingWrap>
					<IconGraphLine color="gray300" theme={theme} size="xs" />
					<GraphSourceHeading>Suggested chart</GraphSourceHeading>
				</GraphSourceHeadingWrap>
				<WidgetCard
				  api={api}
				  organization={organizations[0]}
				  selectionOverride={modifiedSelection}
				  widget={widget}
				  isEditing={false}
				  onDelete={() => undefined}
				  onEdit={() => undefined}
				  renderErrorMessage={() => null}
				  isSorting={false}
				  currentWidgetDragging={false}
				/>
			</GraphSourceWrapper>
		);
	}
};

export default withApi(withOrganizations(withGlobalSelection(GraphSource)));
