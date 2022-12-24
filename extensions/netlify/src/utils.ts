import { Toast, showToast, getPreferenceValues } from '@raycast/api';
import { AxiosError } from 'axios';

import { Preferences } from './interfaces';

export function capitalize(s: string): string {
  return s[0].toUpperCase() + s.substr(1);
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDeployUrl(siteName: string, id: string) {
  return `https://app.netlify.com/sites/${siteName}/deploys/${id}`;
}

export function getDomainUrl(team: string, name: string) {
  return `https://app.netlify.com/teams/${team}/dns/${name}`;
}

export function getToken() {
  const { token } = getPreferenceValues<Preferences>();
  return token;
}

export function handleNetworkError(e: unknown): void {
  const error = e as AxiosError;
  const status = error.response?.status;
  if (!status) {
    showToast(Toast.Style.Failure, 'Unknown error');
  }
  if (status === 401) {
    showToast(
      Toast.Style.Failure,
      'Failed to authorize',
      'Please make sure that your API key is valid.',
    );
  } else {
    showToast(Toast.Style.Failure, 'Network error', 'Please try again later.');
  }
}
