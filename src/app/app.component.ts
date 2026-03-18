import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportComponent } from './report/report.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ReportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  enteredPasscode = '';
  errorMessage = '';
  isUnlocked = false;
  isLoadingPasscode = true;

  private savedPasscode = '';

  constructor() {
    void this.loadPasscode();
  }

  async unlockReport() {
    if (!/^\d{4}$/.test(this.enteredPasscode)) {
      this.errorMessage = 'Enter a valid 4-digit passcode.';
      return;
    }

    if (this.enteredPasscode !== this.savedPasscode) {
      this.errorMessage = 'Incorrect passcode.';
      return;
    }

    this.errorMessage = '';
    this.isUnlocked = true;
  }

  private async loadPasscode() {
    try {
      const response = await fetch('assets/report-access.json', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Unable to load passcode file: ${response.status}`);
      }

      const config = (await response.json()) as { passcode?: string };

      if (!config.passcode || !/^\d{4}$/.test(config.passcode)) {
        throw new Error('Passcode file must contain a 4-digit "passcode" value.');
      }

      this.savedPasscode = config.passcode;
    } catch (error) {
      console.error('Failed to load report access file', error);
      this.errorMessage = 'Unable to load passcode configuration.';
    } finally {
      this.isLoadingPasscode = false;
    }
  }
}
