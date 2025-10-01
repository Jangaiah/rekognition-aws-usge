import { Injectable, isDevMode } from '@angular/core';
import axe from 'axe-core';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityAudit {
   runAudit() {
    if (isDevMode()) {
      setTimeout(() => {
        axe.run(document, {}, (err, results) => {
          if (err) throw err;

          if (results.violations.length) {
            console.group('🚨 Accessibility Violations Found');
            results.violations.forEach(v => {
              console.warn(v.description, v.helpUrl);
              v.nodes.forEach(node => console.log('Node:', node.target));
            });
            console.groupEnd();
          } else {
            console.info('✅ No accessibility violations detected.');
          }
        });
      }, 1000); // wait a bit for Angular rendering
    }
  }
}
