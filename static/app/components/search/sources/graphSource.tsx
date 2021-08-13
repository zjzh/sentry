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
import {
  DisplayType,
} from 'app/views/dashboardsV2/types';
import {IconGraphLine} from 'app/icons/iconGraphLine';


type Props = {
	api: Client;
	organization: Organization;
	selection: GlobalSelection;
  query: string;
};

const quantities = [
	{
		query: 'error', 
		name: 'Errors',
		conditions: 'event.type:error', 
		defaultFields: ["count()"]
	},
	{
		query: 'webhook transactions', 
		name: 'Webhook transactions',
		conditions: 'transaction:/extensions/vercel/webhook/ ', 
		defaultFields: ["count()"]
	},
	{
		query: 'default', 
		name: 'Default',
		conditions: 'event.type:default', 
		defaultFields: ["count()"]
	},
	{
		query: '400', 
		name: '400',
		conditions: 'transaction:/extensions/vercel/webhook/ http.status_code:400', 
		defaultFields: ["count()"]
	},
	{
		query: '401', 
		name: '401',
		conditions: [
			'transaction:/extensions/vercel/webhook/', 
			'http.status_code:401'
		], 
		defaultFields: ["count()"]
	},
	{
		query: '404', 
		name: '404',
		conditions: [
			'transaction:/extensions/vercel/webhook/', 
			'http.status_code:404'
		], 
		defaultFields: ["count()"]
	},
	{
		query: '200', 
		name: '200',
		conditions: 'http.status_code:200', 
		defaultFields: ["count()"]
	}
]
const fields = [
	{
		query: 'count',
		fields: ["count()"]
	},
	{
		query: 'min',
		fields: ["min()"]
	},
	{
		query: 'max',
		fields: ["max()"]
	},
	{
		query: 'average',
		fields: ["avg()"]
	},
	{
		query: 'sum',
		fields: ["sum()"]
	},
	{
		query: 'p100',
		fields: ["p100()"]
	},
	{
		query: 'p99',
		fields: ["p99()"]
	},
	{
		query: 'p95',
		fields: ["p95()"]
	},
	{
		query: 'p75',
		fields: ["p75()"]
	},
	{
		query: 'p50',
		fields: ["p50()"]
	}
]

class GraphSource extends React.Component<Props> {
	parseDatetimeFromQuery(query: string) : GlobalSelection.datetime {
		const datetime = {};
		const highlights = [];

		const isValidDate = (d: Date) : boolean => d instanceof Date && !isNaN(d);

		// Parses a query string to find the date mentioned at the beginning
		// of the string. Note that the date is assumed to be at the beginning.
		// E.g. if queryString = 'Jul 8 until Jul 12', then the return value is
		// a Date object representing Jul 8
		const parseDateFromQueryString = (queryString: string, subStringIndex: number) : {dateObject: Date, highlight: number[]} => {
			const succeedingWords = queryString.split(' ');
			const highlight = [];
			let dateWordLength = 1;
			let dateString = succeedingWords.slice(0, dateWordLength).join(' ');
			let dateObject = SugarDate.create(dateString);
			while (dateWordLength <= succeedingWords.length && isValidDate(dateObject)) {
				dateWordLength += 1;
				dateString = succeedingWords.slice(0, dateWordLength).join(' ');
				dateObject = SugarDate.create(dateString);
			}
			const finalDateString = succeedingWords.slice(0, dateWordLength - 1).join(' ');
			const finalDateObject = SugarDate.create(finalDateString);
			if (isValidDate(finalDateObject)) {
				highlight.push(subStringIndex, subStringIndex + finalDateString.length + 1);
			}
			return {dateObject: finalDateObject, highlight};
		}

		const fromIndex = query.search('from');

		if (fromIndex > -1) {
			const succeedingString = query.slice(fromIndex + 5);
			const {dateObject, highlight} = parseDateFromQueryString(succeedingString, fromIndex + 5);
			if (isValidDate(dateObject)) {
				datetime.start = dateObject;
				datetime.end = Math.min(
					Date.now(),
					new Date((new Date(dateObject)).setDate(dateObject.getDate() + 14))
				);
				if (highlight.length > 0) {
					highlights.push(highlight);
				}
			}
		}

		const sinceIndex = query.search('since');

		if (sinceIndex > -1) {
			const succeedingString = query.slice(sinceIndex + 6);
			const {dateObject, highlight} = parseDateFromQueryString(succeedingString, sinceIndex + 6);
			if (isValidDate(dateObject)) {
				datetime.start = dateObject;
				datetime.end = Date.now();
				if (highlight.length > 0) {
					highlights.push(highlight);
				}
			}
		}

		const toIndex = query.search('to');

		if (toIndex > -1) {
			const succeedingString = query.slice(toIndex + 3);
			const {dateObject, highlight} = parseDateFromQueryString(succeedingString, toIndex + 3);
			if (isValidDate(dateObject)) {
				datetime.end = dateObject;
				if (highlight.length > 0) {
					highlights.push(highlight);
				}
			}
		}

		const untilIndex = query.search('until');

		if (untilIndex > -1) {
			const succeedingString = query.slice(untilIndex + 6);
			const {dateObject, highlight} = parseDateFromQueryString(succeedingString, untilIndex + 6);
			if (isValidDate(dateObject)) {
				datetime.end = dateObject;
				if (highlight.length > 0) {
					highlights.push(highlight);
				}
			}
		}

		return {datetime, highlights};
	}

	parseQuantityFromQuery(query: string) : Widget {
    const mentionedQuantities = quantities.filter(quantity => query.includes(quantity.query));
    if (mentionedQuantities.length > 0) {
			const widget = {
		  	title: '',
	      displayType: DisplayType.LINE,
	      interval: '5m',
	      queries: []
	    };
	    const highlights = [];
    	mentionedQuantities.forEach(quantityObject => {
    		const highlightStart = query.search(quantityObject.query)
    		const highlightEnd = highlightStart + quantityObject.query.length
    		highlights.push([highlightStart, highlightEnd])

    		widget.queries.push({
    			"name": quantityObject.name,
    			"fields": quantityObject.defaultFields,
    			"conditions": quantityObject.conditions,
    			"orderby": ""
    		});
    	});

    	const mentionedFields = fields.filter(field => query.includes(field.query))
    	mentionedFields.forEach(field => {
    		const highlightStart = query.search(field.query)
    		const highlightEnd = highlightStart + field.query.length
    		highlights.push([highlightStart, highlightEnd])

    		widget.queries.forEach(query => {
    			query.fields = field.fields;
    		})
    	})

    	return {widget, highlights};
    }
    return {widget: null, highlights: []};
	}

	render() {
		const {
			api, 
			// todo: loop through all orgs?
			organizations, 
			query, 
			selection,
			setInputHighlights
		} = this.props;
		const {
			datetime,
			highlights: datetimeHighlights
		} = this.parseDatetimeFromQuery(query);
		const {
			widget,
			highlights: widgetHighlights
		} = this.parseQuantityFromQuery(query);

		if (!widget) {
			return null;
		}

		const highlights = [0];
		([
			...widgetHighlights,
			...datetimeHighlights
		]).sort((a, b) => a[0] - b[0])
			.forEach(highlightArr => {
				highlights.push(highlightArr[0], highlightArr[1])
			})

		const querySpans = highlights.map((location, ind) => {
		  return query.slice(location, highlights[ind + 1])
		})

		const modifiedSelection = {
			...selection,
			datetime: {
				...selection.datetime,
				...datetime,
				period: null
			}
		}

		console.log(highlights)

		return (
			<GraphSourceWrapper>
				<GraphSourceHeadingWrap>
					<IconGraphLine color="gray300" theme={theme} size="xs" />
					<GraphSourceHeading>Suggested chart</GraphSourceHeading>
				</GraphSourceHeadingWrap>
				<GraphSourceContentWrap>
					<StyledQuery>
					  {querySpans.map((text, ind) => {
					    if (ind % 2 === 0) {
					      return <span key={ind}>{text}</span>
					    } else {
					      return (
					        <StyledQueryHighlight key={ind}>
					          {text}
					        </StyledQueryHighlight>
					      )
					    }
					  })}
					</StyledQuery>
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
				</GraphSourceContentWrap>
			</GraphSourceWrapper>
		);
	}
};

export default withApi(withOrganizations(withGlobalSelection(GraphSource)));

const GraphSourceWrapper = styled('div')`
	padding: 10px;
`
const GraphSourceHeadingWrap = styled('div')`
	display: flex;
	align-items: center;
	margin-left: 5px;
	margin-bottom: 5px;
`
const GraphSourceHeading = styled('p')`
	font-size: 0.875em;
	font-weight: 600;
	color: ${p => p.theme.gray300};
	text-transform: uppercase;
	margin-left: 5px;
	margin-bottom: 0;
`
const GraphSourceContentWrap = styled('div')`
	margin-left: 21px;
`
const StyledQuery = styled('p')`
	margin-bottom: 5px;
	margin-left: 1px;
  color: ${p => p.theme.gray500};
`
const StyledQueryHighlight = styled('span')`
  color: ${p => p.theme.purple300}
`
