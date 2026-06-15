import { Component, inject } from '@angular/core';
import { SCORM } from '@studiolxd/scorm/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <p>SCORM {{ scorm.status().version }} — initialized: {{ scorm.status().initialized }}</p>
  `,
})
export class AppComponent {
  // Inject the session handle provided by provideScorm(); status is a signal.
  readonly scorm = inject(SCORM);

  constructor() {
    this.scorm.session.initialize();
  }
}
