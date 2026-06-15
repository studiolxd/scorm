import { bootstrapApplication } from '@angular/platform-browser';
import { provideScorm } from '@studiolxd/scorm/angular';
import { AppComponent } from './app/app.component';

// Validates that @studiolxd/scorm/angular's functional provider compiles and wires
// up in a real Angular AOT/production build (no ng-packagr / decorators in the lib).
bootstrapApplication(AppComponent, {
  providers: [provideScorm('auto', { noLmsBehavior: 'mock' })],
}).catch((err: unknown) => console.error(err));
