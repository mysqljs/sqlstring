export declare function escapeId(val: string | string[], forbidQualified?: boolean): string;
export declare function escape(val: any, stringifyObjects?: boolean, timeZone?: string): string;
export declare function arrayToList(array: any[], timeZone?: string): string;
export declare function format(sql: string, values?: any | any[], stringifyObjects?: boolean, timeZone?: string): string;
export declare function dateToString(date: Date | string, timeZone?: string): string;
export declare function bufferToString(buffer: Buffer): string;
export declare function objectToValues(object: any, timeZone?: string): string;