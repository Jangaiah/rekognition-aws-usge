import { AfterViewInit, Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccessibilityAudit } from './services/accessibility-audit';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit{
  protected readonly title = signal('demo');
  constructor(private accessibilityAudit: AccessibilityAudit) {}
  ngAfterViewInit(): void {
    this.accessibilityAudit.runAudit();
  }
}
