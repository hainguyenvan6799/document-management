import { TestBed } from '@angular/core/testing';

import { ScrollService } from './scroll.service';

describe('ScrollService', () => {
  let service: ScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    jest.spyOn(window, 'addEventListener');
    service = TestBed.inject(ScrollService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should add a scroll event listener on initialization', () => {
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.bind(Function as any) as EventListenerOrEventListenerObject,
      true,
    );
  });
});
