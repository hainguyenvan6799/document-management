import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  ViewChild,
  Pipe,
  PipeTransform
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Pipe({
  name: 'findLabel',
  standalone: true
})
export class FindLabelPipe<Y> implements PipeTransform {
  transform(options: { label: string; value: Y }[], value: Y): string {
    if (!options || !value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : '';
  }
}

@Component({
  selector: 'cc-select',
  standalone: true,
  imports: [CommonModule, FindLabelPipe],
  templateUrl: './cc-select.component.html',
  styleUrl: './cc-select.component.scss',
})
export class CcSelectComponent<T> {
  @Input() options: { label: string; value: T }[] = [];
  @Input() label: string = '';
  @Input() defaultValue!: T;
  private readonly elementRef: ElementRef = inject(ElementRef);
  constructor() {}
  @Output() onChange = new EventEmitter<T>();
  @Output() valueChange = new EventEmitter<T>();
  @ViewChild('dropdown') dropdown!: ElementRef;
  @Input() width: string = '';

  value!: T;

  ngOnInit() {
    if (this.defaultValue) {
      this.value = this.defaultValue;
      this.valueChange.emit(this.defaultValue);
    }
  }

  toggleDropdown() {
    const currentDisplay = this.dropdown.nativeElement.style.display;
    this.dropdown.nativeElement.style.display =
      currentDisplay === 'block' ? 'none' : 'block';
  }
  selectValue(value: T) {
    this.value = value;
    this.onChange.emit(value);
    this.valueChange.emit(value);
    this.dropdown.nativeElement.style.display = 'none';
  }
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.handleFocusOut();
    }
  }

  handleFocusOut() {
    if (!this.dropdown) return;
    this.dropdown.nativeElement.style.display = 'none';
  }
}
