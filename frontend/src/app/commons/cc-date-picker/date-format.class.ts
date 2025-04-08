import { Signal } from '@angular/core';
// import { ObjectUtil } from '@shared/utils/object.util';
import moment from 'moment';

export class DateFormat {
  format!: Signal<DATE_FORMAT>;
  get display() {
    return {
      dateInput: this.format(),
      ...DEFAULT_DISPLAY_DATE_FORMAT,
    };
  }
  get parse() {
    return {
      dateInput: this.format(),
    };
  }
}

export function isValidDateFormat(format: string): boolean {
  const testDate = moment().format(format);
  const parsedDate = moment(testDate, format, true);
  return parsedDate.isValid();
}

export function correctFormat(format: DATE_FORMAT): DATE_FORMAT {
  if (isValidDateFormat(format)) return format;
  return DEFAULT_DATE_FORMAT;
}

export type DATE_FORMAT = 'DD/MM/YYYY' | 'DD-MMM-YYYY' | 'YYYY-MM-DD';
export const DEFAULT_DATE_FORMAT: DATE_FORMAT = 'DD/MM/YYYY';
export const DEFAULT_DISPLAY_DATE_FORMAT = {
  monthYearLabel: 'YYYY',
  dateA11yLabel: 'LL',
  monthYearA11yLabel: 'YYYY',
};

class ObjectUtil {
  public static deepFreeze(obj: any) {
    Object.keys(obj).forEach((prop) => {
      if (typeof obj[prop] === 'object') this.deepFreeze(obj[prop]);
    });
    return Object.freeze(obj);
  }
}
ObjectUtil.deepFreeze(DEFAULT_DISPLAY_DATE_FORMAT);
