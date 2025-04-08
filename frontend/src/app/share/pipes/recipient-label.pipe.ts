import { Pipe, PipeTransform } from '@angular/core';
import { L10nLocale, L10nTranslationService } from 'angular-l10n';

@Pipe({
  name: 'recipientLabel',
  standalone: true
})
export class RecipientLabelPipe implements PipeTransform {
  constructor(private translation: L10nTranslationService) {}

  transform(value: string): string {
    if (!value) {
      return '';
    }

    const currentLocale = this.translation.getLocale();
    const isVi = currentLocale.language === 'vi';

    switch (value) {
      case 'staff':
        return isVi ? 'Nhân viên' : 'Staff';
      case 'staff-management':
      case 'management-staff':
        return isVi ? 'CBQL' : 'Staff management';
      case 'teacher':
        return isVi ? 'Giáo viên' : 'Teacher';
      default:
        return value;
    }
  }
} 