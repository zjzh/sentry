import {IssueConfigField} from 'app/types/index';

export type IssueAlertRuleFormField =
  | {
      type: 'choice';
      choices?: [string, string][];
      initial?: string;
      placeholder?: string;
    }
  | {
      type: 'string';
      initial?: string;
      placeholder?: string;
    }
  | {
      type: 'number';
      placeholder?: number | string;
      initial?: string;
    };

/**
 * These templates that tell the UI how to render the action or condition
 * and what fields it needs
 */
export type IssueAlertRuleActionTemplate = {
  id: string;
  label: string;
  prompt: string;
  enabled: boolean;
  actionType?: 'ticket';
  formFields?: {
    [key: string]: IssueAlertRuleFormField;
  };
  ticketType?: string;
  link?: string;
};
export type IssueAlertRuleConditionTemplate = IssueAlertRuleActionTemplate;

/**
 * These are the action or condition data that the user is editing or has saved.
 */
export type IssueAlertRuleAction = Omit<
  IssueAlertRuleActionTemplate,
  'formFields' | 'enabled'
> & {
  dynamic_form_fields?: IssueConfigField[];
} & {
  // These are the same values as the keys in `formFields` for a template
  [key: string]: number | string;
};

export type IssueAlertRuleCondition = Omit<
  IssueAlertRuleConditionTemplate,
  'formFields' | 'enabled'
> & {
  dynamic_form_fields?: IssueConfigField[];
} & {
  // These are the same values as the keys in `formFields` for a template
  [key: string]: number | string;
};

export type UnsavedIssueAlertRule = {
  /** When an issue matches [actionMatch] of the following */
  actionMatch: 'all' | 'any' | 'none';
  /** If that issue has [filterMatch] of these properties */
  filterMatch: 'all' | 'any' | 'none';
  actions: IssueAlertRuleAction[];
  conditions: IssueAlertRuleCondition[];
  filters: IssueAlertRuleCondition[];
  environment?: null | string;
  frequency: number;
  name: string;
  owner?: string | null;
};

// Issue-based alert rule
export type IssueAlertRule = UnsavedIssueAlertRule & {
  dateCreated: string;
  createdBy: {id: number; email: string; name: string} | null;
  projects: string[];
  id: string;
};

export enum MailActionTargetType {
  IssueOwners = 'IssueOwners',
  Team = 'Team',
  Member = 'Member',
}

export enum AssigneeTargetType {
  Unassigned = 'Unassigned',
  Team = 'Team',
  Member = 'Member',
}

export type NoteType = {
  text: string;
  mentions: string[];
};

const AGE_COMPARISON_FILTER = 'sentry.rules.filters.age_comparison.AgeComparisonFilter' as const;
const EVENT_ATTRIBUTE_FILTER = 'sentry.rules.filters.event_attribute.EventAttributeFilter' as const;
const LEVEL_FILTER = 'sentry.rules.filters.level.LevelFilter' as const;
const LATEST_RELEASE_FILTER = 'sentry.rules.filters.latest_release.LatestReleaseFilter' as const;
const ISSUE_OCCURRENCES_FILTER = 'sentry.rules.filters.issue_occurrences.IssueOccurrencesFilter' as const;
const TAGGED_EVENT_FILTER = 'sentry.rules.filters.tagged_event.TaggedEventFilter' as const;
const ASSIGNED_TO_FILTER = 'sentry.rules.filters.assigned_to.AssignedToFilter' as const;

enum EventMatchType {
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  STARTS_WITH = 'sw',
  NOT_STARTS_WITH = 'nsw',
  ENDS_WITH = 'ew',
  NOT_ENDS_WITH = 'new',
  CONTAINS = 'co',
  NOT_CONTAINS = 'nc',
  IS_SET = 'is',
  NOT_SET = 'ns',
}

/**
 * The event's {attribute} value {match} {value}
 */
export type EventAttributeFilter = {
  id: typeof EVENT_ATTRIBUTE_FILTER;
  attribute:
    | 'message'
    | 'platform'
    | 'environment'
    | 'type'
    | 'exception.type'
    | 'exception.value'
    | 'user.id'
    | 'user.email'
    | 'user.username'
    | 'user.ip_address'
    | 'http.method'
    | 'http.url'
    | 'stacktrace.code'
    | 'stacktrace.module'
    | 'stacktrace.filename'
    | 'stacktrace.abs_path'
    | 'stacktrace.package';
  match: EventMatchType;
  value: string;
};

enum LevelMatchType {
  EQUAL = 'eq',
  LESS_OR_EQUAL = 'lte',
  GREATER_OR_EQUAL = 'gte',
}

enum EventLevel {
  CRITICAL = '50',
  ERROR = '40',
  WARNING = '30',
  INFO = '20',
  DEBUG = '10',
  NOTSET = '0',
}

/**
 * The issue is {comparison_type} than {value} {time}
 */
export type AgeComparisonFilter = {
  id: typeof AGE_COMPARISON_FILTER;
  comparison_type: 'older' | 'newer';
  time: 'minute' | 'hour' | 'day' | 'week';
};

/**
 * The event's level is {match} {level}
 */
export type LevelFilter = {
  id: typeof LEVEL_FILTER;
  level: EventLevel;
  match: LevelMatchType;
};

/**
 * The event is from the latest release
 */
export type LatestReleaseFilter = {
  id: typeof LATEST_RELEASE_FILTER;
};

/**
 * The issue has happened at least {value} times
 */
export type IssueOccurrencesFilter = {
  id: typeof ISSUE_OCCURRENCES_FILTER;
  value: string;
};

/**
 * The event's tags match {key} {match} {value}
 */
export type TaggedEventFilter = {
  id: typeof TAGGED_EVENT_FILTER;
  match: EventMatchType;
  key: string;
  value: string;
};

/**
 *
 */
export type AssignedToFilter = {
  id: typeof ASSIGNED_TO_FILTER;
  /** Team or user id (not slug) */
  targetIdentifier?: string;
  targetType: 'Team' | 'Member' | 'Unassigned';
};
