import axios, { AxiosInstance } from 'axios';

import {
  AlgoliaHit,
  AuditLog,
  Committer,
  Deploy,
  Domain,
  Member,
  Reviewer,
  Site,
  Team,
  User,
} from './interfaces';
import { getPreferences } from './utils';

const ALGOLIA_APP_ID = '4RTNPM1QF9';
const ALGOLIA_PUBLIC_API_KEY = '260466eb2466a36278b2fdbcc56ad7ba';
const ALGOLIA_INDEX_NAME = 'docs-manual';

class Api {
  algolia: AxiosInstance;
  netlify: AxiosInstance;

  constructor(apiToken: string) {
    this.algolia = axios.create({
      baseURL: `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'netlify-raycast-extension',
      },
    });
    this.netlify = axios.create({
      baseURL: 'https://api.netlify.com/api/v1',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'User-Agent': 'netlify-raycast-extension',
      },
    });
  }

  async getAuditLog(team: string): Promise<AuditLog[]> {
    const { data } = await this.netlify.get<AuditLog[]>(
      `/accounts/${team}/audit?page=1&per_page=200`,
    );
    return data;
  }

  async getCommitters(team: string): Promise<Committer[]> {
    const { data } = await this.netlify.get<Committer[]>(`/${team}/committers`);
    return data;
  }

  async getDeploys(site: string): Promise<Deploy[]> {
    const { data } = await this.netlify.get<Deploy[]>(`/sites/${site}/deploys`);
    return data;
  }

  async getDomains(): Promise<Domain[]> {
    const { data } = await this.netlify.get<Domain[]>('/dns_zones');
    return data;
  }

  async getMembers(team: string): Promise<Member[]> {
    const { data } = await this.netlify.get<Member[]>(`/${team}/members`);
    return data;
  }

  async getReviewers(team: string): Promise<Reviewer[]> {
    const { data } = await this.netlify.get<Reviewer[]>(`/${team}/reviewers`);
    return data;
  }

  async getSites(query: string, team?: string): Promise<Site[]> {
    const params = [
      `name=${query}`,
      `filter=all`,
      `sort_by=updated_at`,
      `page=1`,
      `per_page=30`,
      `include_favorites=true`,
    ];
    const path = [team && `/${team}`, `/sites?${params.join('&')}`]
      .filter(Boolean)
      .join('');
    const { data } = await this.netlify.get<Site[]>(path);
    return data;
  }

  async getTeams(): Promise<Team[]> {
    const { data } = await this.netlify.get<Team[]>(`/accounts`);
    return data;
  }

  async getUser(): Promise<User> {
    const { data } = await this.netlify.get<User>(`/user`);
    return data;
  }

  async saveFavorites(favorites: string[]): Promise<User> {
    const { data } = await this.netlify.put<User>(`/user`, {
      favorite_sites: favorites,
    });
    return data;
  }

  async searchDocs(query: string, limit = 20): Promise<AlgoliaHit[]> {
    const params = [
      `x-algolia-application-id=${ALGOLIA_APP_ID}`,
      `x-algolia-api-key=${ALGOLIA_PUBLIC_API_KEY}`,
    ].join('&');
    const body = {
      indexName: ALGOLIA_INDEX_NAME,
      params: `query=in+the+docs+${query}&hitsPerPage=${limit}`,
    };
    const { data } = await this.algolia.post(
      `/indexes/*/queries?${params}`,
      body,
    );
    return data.data.results[0].hits;
  }
}

const { token } = getPreferences();
const api = new Api(token);

export default api;
