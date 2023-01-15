import { ActionPanel, Color, Icon, List } from '@raycast/api';
import { useCachedState } from '@raycast/utils';
import { useEffect, useState } from 'react';

import { OpenOnNetlify } from './components/actions';
import TeamDropdown from './components/team-dropdown';
import api from './utils/api';
import { getDomainUrl, handleNetworkError } from './utils/helpers';
import { formatDate } from './utils/helpers';
import { Domain, DomainSearch, Team } from './utils/interfaces';

export default function Command() {
  const [isLoading, setLoading] = useState<boolean>(true);

  const [teams, setTeams] = useState<Team[]>([]);
  const [registeredDomains, setRegisteredDomains] = useState<Domain[]>([]);
  const [searchedDomains, setSearchedDomains] = useState<DomainSearch[]>([]);

  const [query, setQuery] = useState<string>('');
  const [teamSlug, setTeamSlug] = useCachedState<string>('teamSlug', '');

  async function fetchDomains(team: string) {
    setLoading(true);
    try {
      const domains = await api.getDomains(team);
      setRegisteredDomains(domains);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleNetworkError(e);
    }
  }

  async function searchDomains(query: string, team: string) {
    setLoading(true);
    try {
      const domains = await api.searchDomains(query, team);
      setSearchedDomains(domains);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleNetworkError(e);
    }
  }

  async function fetchTeams() {
    setLoading(true);
    try {
      const teams = await api.getTeams();
      setTeams(teams);
      if (teams.length === 1 || !teamSlug) {
        const user = await api.getUser();
        setTeamSlug(user.preferred_account_id);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleNetworkError(e);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchDomains(teamSlug);
  }, [teamSlug]);

  useEffect(() => {
    if (query) {
      searchDomains(query, teamSlug);
    } else {
      setSearchedDomains([]);
    }
  }, [query]);

  const teamDropdown = (
    <TeamDropdown
      required
      teamSlug={teamSlug}
      setTeamSlug={setTeamSlug}
      teams={teams}
    />
  );

  return (
    <List
      isLoading={isLoading}
      filtering
      onSearchTextChange={setQuery}
      searchText={query}
      searchBarAccessory={teams.length > 1 ? teamDropdown : undefined}
      searchBarPlaceholder="Search for a domain name..."
      throttle
    >
      <List.Section title="Registered domains">
        {registeredDomains.map((domain) => (
          <List.Item
            key={domain.name}
            icon={Icon.Globe}
            title={domain.name}
            subtitle={domain.account_name}
            keywords={domain.account_slug.split('-')}
            // @ts-expect-error idk how to fix
            accessories={
              domain.domain
                ? [
                    domain.domain?.auto_renew &&
                      domain.domain?.renewal_price && {
                        text: `$${domain.domain?.renewal_price}`,
                      },
                    domain.domain?.auto_renew && {
                      tag: { color: Color.Blue, value: 'Auto-renew' },
                      tooltip: `Auto-renews on ${formatDate(
                        domain.domain?.auto_renew_at,
                      )} for $${domain.domain?.renewal_price}`,
                    },
                    !domain.domain?.auto_renew &&
                      new Date(domain.domain?.expires_at) > new Date() && {
                        tag: { color: Color.Orange, value: 'Expiring' },
                        tooltip: `Expires on ${formatDate(
                          domain.domain?.expires_at,
                        )}`,
                      },
                    !domain.domain?.auto_renew &&
                      new Date(domain.domain?.expires_at) <= new Date() && {
                        tag: { color: Color.Red, value: 'Expired' },
                        tooltip: `Expired on ${formatDate(
                          domain.domain?.expires_at,
                        )}`,
                      },
                  ].filter(Boolean)
                : [
                    {
                      tag: { color: Color.SecondaryText, value: 'External' },
                      tooltip: 'Registered externally',
                    },
                  ]
            }
            actions={
              <ActionPanel>
                <OpenOnNetlify
                  url={getDomainUrl(domain.account_slug, domain.name)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {searchedDomains.length > 0 && (
        <List.Section title="Search results">
          {searchedDomains.map((domain) => (
            <List.Item
              key={domain.delegated_domain || query}
              icon={Icon.Globe}
              title={domain.delegated_domain || query}
              subtitle={
                domain.available
                  ? 'Available'
                  : domain.owned_by_account
                  ? 'Registered by Team'
                  : 'Not Available'
              }
              // @ts-expect-error idk how to fix
              accessories={[
                domain.available && {
                  tag: { color: Color.Green, value: `$${domain.price}` },
                  tooltip: `$${domain.price} for the first year, $${domain.renewal_price} to renew`,
                },
              ].filter(Boolean)}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
